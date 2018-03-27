import {render, createElement} from './lib'

const Div = props => {
	const {a}: {a: string} = props
	const change = () => {
		console.log('changing')
		props.a = 'dafuq2'
	}
	return (
		<div>
			<button onClick={change}>test</button>
			<br />
			<span>{a}</span>
		</div>
	)
}

render(document.getElementById('root'), <Div a="dafuq" />)
