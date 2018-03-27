/**
 * Virtual Dom Node
 * Will not be rendered in diff algorithm
 */
export class Node {
	static _$$name = 'VirtualNode'
	public _$$children: any[]
	public _$$element?: HTMLElement
	public _$$type: string
	public _$$props: any

	public get props() {
		return this._$$props
	}
	public set props(x) {
		this._$$props = x
	}
	public get type() {
		return this._$$type
	}
	public get element() {
		return this._$$element
	}
	public get children() {
		return this._$$children
	}
	public set children(x) {
		this._$$children = x
		this.reRender()
	}

	public setProps = () => {
		if (!this._$$element)
			this._$$element = document.createElement(this.type)
		const {class: className, id, onClick} = this.props
			? this.props
			: {class: undefined, id: undefined, onClick: undefined}
		id && (this._$$element.id = id)
		className && (this._$$element.className = className)
		if (this.type === 'button' && onClick) {
			this._$$element.addEventListener('click', onClick)
		}
		return this
	}

	public reRender = () => {
		const el = this._$$element as HTMLElement
		while (el.firstChild) el.removeChild(el.firstChild)
		this.renderChild()
	}

	public renderChild = () => {
		this.children.forEach(child => {
			if (typeof child === 'string') {
				;(this._$$element as HTMLElement).appendChild(
					document.createTextNode(child)
				)
			} else if (typeof child === 'number') {
				;(this._$$element as HTMLElement).appendChild(
					document.createTextNode(child.toString())
				)
			} else {
				child.render()
				;(this._$$element as HTMLElement).appendChild(child.element)
			}
		})
	}

	public render = () => {
		this.setProps()
		this.renderChild()
		return this
	}
	constructor(type: string, props, children) {
		this._$$type = type
		this._$$children = children
		this._$$props = props
	}
}

/**
 * A naive virtual dom tree diff algorithm
 * @param oldNode current node
 * @param newNode new node without rendering (DOM manipulation) but virtual dom tree
 */
const diff = (oldNode: Node, newNode: Node) => {
	const oldChildren = oldNode.children
	const newChildren = newNode.children
	oldChildren.forEach((oldChild, index) => {
		const newChild = newChildren[index]
		if (
			oldChild &&
			newChild &&
			oldChild.constructor._$$name === 'VirtualNode' &&
			newNode.children[index].constructor._$$name === 'VirtualNode'
		) {
			diff(oldChild, newChild)
		} else if (oldChild !== newChild) {
			oldNode.children = newNode.children
		}
	})
}

/**
 * Functional class will re-render when prop object change
 */
export class Functional {
	public _$$type: any
	public _$$node: Node
	public _$$props

	public get type() {
		return this._$$type
	}
	public get node() {
		return this._$$node
	}
	public get props() {
		return this._$$props
	}

	public onPropChange = (oldValue, newValue) => {
		// new props will arrived in next tick
		setTimeout(() => {
			const newNode = this.type(this.props)
			//console.log('old node', this.node)
			//console.log('new node', newNode)
			diff(this.node, newNode)
		}, 0)
	}
	constructor(type, props, children) {
		this._$$type = type
		this._$$props = props
		this._$$node = type(props)
	}
}

/**
 * Create element function as replace of React.createElement
 * @param type type of element, can be function or html dom type
 * @param props element properties
 * @param children element children
 */
export function createElement(
	type: ((props: any) => Node) | string,
	props,
	...children
): Node {
	let node: Node
	let functional: Functional

	const _props = props
		? new Proxy(props, {
				get(target, key) {
					return target[key]
				},
				set(target, key, value) {
					//console.log('props change', target, key, value, element)
					if (typeof type === 'function')
						functional.onPropChange(target[key], value)
					target[key] = value
					return true
				}
		  })
		: null

	if (typeof type === 'function') {
		functional = new Functional(type, _props, children)
		node = functional.node
	} else {
		node = new Node(type, _props, children)
	}

	return node
}

/**
 * Mount vdom to real dom
 * @param DOM Mount point
 * @param vdom Entry of virtual dom
 */
export const render = (DOM: HTMLElement | null, vdom: Node) => {
	if (DOM) {
		while (DOM.firstChild) DOM.removeChild(DOM.firstChild)
		vdom.render()
		if (vdom.element) DOM.appendChild(vdom.element)
	}
}
