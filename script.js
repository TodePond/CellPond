
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
	const neighbours = {
		left: undefined,
		right: undefined,
		up: undefined,
		down: undefined,
	}
	const cell = {x, y, width, height, colour, neighbours}
	return cell
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
	cells: [makeCell({colour: 777})],
	aer: 0.05,
	speed: 200,
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
		if (context.fillStyle !== colour) {
			context.fillStyle = colour
		}

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
		state.speed = state.cells.length * state.aer
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

		//DEBUG_FIZZ(cell, id)
		DEBUG_WORLD(cell, id)
		//DEBUG_DRIFT(cell, id)
		
	}

	// start on 888
	const DEBUG_WORLD = (cell, id) => {
		if (cell.colour < 111) return
		cell.colour -= 111
		drawCell(cell)
		const width = 2
		const height = 2
		const children = splitCell(cell, id, width, height)
		for (const child of children) {
			drawCell(child)
		}
	}

	// start on 888
	const DEBUG_FIZZ = (cell, id) => {

		let width = 1
		let height = 1

		if (cell.colour >= 100) {
			cell.colour -= 100
			width = 2
			height = 2
		}

		const children = splitCell(cell, id, width, height)

		for (const child of children) {
			const r = child.colour - (child.colour % 100)
			const gb = Random.Uint8 % 100
			child.colour = r + gb
			drawCell(child)
		}

	}

	const clamp = (number, min, max) => {
		if (number < min) return min
		if (number > max) return max
		return number
	}

	const DEBUG_DRIFT = (cell, id) => {

		const width = 2
		const height = 2

		const gb = cell.colour % 100
		let b = gb % 10
		let r = cell.colour - gb
		let g = gb - b
		
		r += oneIn(2)? 100 : -100
		g += oneIn(2)? 10 : -10
		b += oneIn(2)? 1 : -1

		r = clamp(r, 0, 900)
		g = clamp(g, 0, 90)
		b = clamp(b, 0, 9)

		cell.colour = r+g+b
		
		const children = splitCell(cell, id, width, height)
		for (const child of children) {
			drawCell(child)
		}

	}
	
	const splitCell = (cell, id, width, height) => {
	
		const cellRight = cell.x + cell.width
		const cellBottom = cell.y + cell.height

		const childWidth = cell.width / width
		const childHeight = cell.height / height

		const children = []

		let i = 0
		for (let x = cell.x; x < cellRight; x += childWidth) {
			for (let y = cell.y; y < cellBottom; y += childHeight) {
				const child = makeCell({x, y, width: childWidth, height: childHeight, colour: cell.colour})
				children.push(child)
				i++
			}
		}

		// Link neighbours
		let j = 0
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				const child = children[j]

				if (x === 0) child.neighbours.left = cell.left
				else child.neighbours.left = children[j-width]

				if (y === 0) child.neighbours.top = cell.top
				else child.neighbours.top = children[j-1]

				if (x === width-1) child.neighbours.right = cell.right
				else child.neighbours.right = children[j+width]

				if (y === height-1) child.neighbours.bottom = cell.bottom
				else child.neighbours.bottom = children[j+1]

				j++
			}
		}
		
		// Insert children
		state.cells.splice(id, 1, ...children)

		return children
	}
	
	state.fire = FIRE.randomSpotEvents

})
