
//========//
// COLOUR //
//========//
Colour.splash()
const TODEPOND_COLOURS = [
	Colour.Green.splash,
	Colour.Red.splash,
	Colour.Blue.splash,
	Colour.Yellow.splash,
	Colour.Orange.splash,
	Colour.Pink.splash,
	Colour.Rose.splash,
	Colour.Cyan.splash,
	Colour.Purple.splash,

	Colour.Black.splash,
	Colour.Grey.splash,
	Colour.Silver.splash,
	Colour.White.splash,
]

const TODEPOND_RAINBOW_COLOURS = TODEPOND_COLOURS.slice(0, -4)

//======//
// CELL //
//======//
const makeCell = ({x=0, y=0, width=1, height=1, colour=112} = {}) => {
	const cell = {x, y, width, height, colour}
	return cell
}

const splitCell = (cell, width, height, colours = []) => {
	
	const cellRight = cell.x + cell.width
	const cellBottom = cell.y + cell.height

	const childWidth = cell.width / width
	const childHeight = cell.height / height

	const children = []

	let i = 0
	for (let x = cell.x; x < cellRight; x += childWidth) {
		for (let y = cell.y; y < cellBottom; y += childHeight) {
			const colour = colours[i] !== undefined? colours[i] : cell.colour
			const child = makeCell({x, y, width: childWidth, height: childHeight, colour: cell.colour})
			children.push(child)
			i++
		}
	}

	return children
}

// TODO: make this quicker (it is slow)
const pickCell = (x, y) => {
	for (let i = 0; i < state.cells.length; i++) {
		const cell = state.cells[i]
		if (cell.x > x) continue
		if (cell.y > y) continue
		if (cell.x+cell.width <= x) continue
		if (cell.y+cell.height <= y) continue
		return [cell, i]
	}
}

//=======//
// STATE //
//=======//
const state = {
	cells: [makeCell({colour: 888})],
	speed: 1000,
	ticker: () => {},
}

const FIRE = {}

//=======//
// SETUP //
//=======//
on.load(() => {

	const show = Show.start({paused: true})
	const {context, canvas} = show

	//======//
	// DRAW //
	//======//
	const drawCells = () => {
		for (const cell of state.cells) {
			drawCell(cell)
		}
	}

	const drawCell = (cell) => {
		const colour = Colour.splash(cell.colour)
		context.fillStyle = colour

		const x = canvas.width * cell.x
		const y = canvas.height * cell.y
		const width = canvas.width * cell.width
		const height = canvas.height * cell.height
		context.fillRect(x, y, width, height)
	}

	//======//
	// TICK //
	//======//
	drawCells()
	show.tick = () => {
		state.fire()
	}
	
	FIRE.randomSpotEvents = () => {
		for (let i = 0; i < state.speed; i++) {
			fireRandomSpotEvent()
		}
	}

	FIRE.randomCellEvents = () => {
		for (let i = 0; i < state.speed; i++) {
			fireRandomCellEvent()
		}
	}

	const fireRandomCellEvent = () => {
		const id = Random.Uint32 % state.cells.length
		const cell = state.cells[id]
		fireCellEvent(cell, id)
	}

	const fireRandomSpotEvent = () => {
		const x = Math.random()
		const y = Math.random()
		fireSpotEvent(x, y)
	}

	const fireSpotEvent = (x, y) => {
		const [cell, id] = pickCell(x, y)
		fireCellEvent(cell, id)
	}

	// this function is currently full of debug code
	const fireCellEvent = (cell, id) => {

		let w = 1
		let h = 1

		if (cell.colour >= 111) {
			cell.colour -= 111
			h = 2
			w = 2
		}
		else return

		/*w = 2
		h = 2*/

		const children = splitCell(cell, w, h)
		state.cells.splice(id, 1, ...children)
		for (const child of children) {
			//child.colour = Random.Uint32 % 500
			drawCell(child)
		}

	}
	
	state.fire = FIRE.randomSpotEvents

})
