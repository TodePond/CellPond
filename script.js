
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
	return [undefined, undefined]
}

//=======//
// STATE //
//=======//
const state = {

	cells: [makeCell({colour: 777})],
	grid: [],
	ticker: () => {},
	
	speed: {
		count: 200,
		dynamic: true,
		aer: 0.1,
	},

	brush: {
		colour: Colour.Yellow.splash,
		//colour: 333,
	},
}

const FIRE = {}

//======//
// GRID //
//======//
// The grid is basically the screen cut up into smaller sections
// It helps to speed up cell lookup because it gives us a smaller area to search through
// Note: Cells can be in multiple sections if they are big enough :)
const GRID_SIZE = 10
for (let x = 0; x < GRID_SIZE; x++) {
	for (let y = 0; y < GRID_SIZE; y++) {
		const section = new Set()
		state.grid.push(section)
	}
}

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

	const CELL_OVERFIT = 1.1
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

	//========//
	// CURSOR //
	//========//
	const updateCursor = () => {

		if (!Mouse.Left) return
		let [x, y] = Mouse.position
		if (x === undefined || y === undefined) {
			return
		}

		x /= canvas.width
		y /= canvas.height

		const [cell] = pickCell(x, y)
		if (cell === undefined) return
		cell.colour = state.brush.colour
		drawCell(cell)
	}

	//======//
	// TICK //
	//======//
	drawCells()
	show.tick = () => {
		updateCursor()
		if (show.paused) return
		state.fire()
	}
	
	FIRE.randomSpotEvents = () => {
		const count = state.speed.dynamic? state.speed.aer * state.cells.length : state.speed.count
		for (let i = 0; i < count; i++) {
			fireRandomSpotEvent()
		}
	}

	FIRE.randomCellEvents = () => {
		const count = state.speed.dynamic? state.speed.aer * state.cells.length : state.speed.count
		for (let i = 0; i < count; i++) {
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

		const behave = BEHAVE.get(cell.colour)
		if (behave !== undefined) {
			return behave(cell, id)
		}

		//DEBUG_FIZZ(cell, id)
		DEBUG_WORLD(cell, id)
		//DEBUG_DRIFT(cell, id)
		
	}
	
	state.fire = FIRE.randomCellEvents
	
	//=======//
	// SPLIT //
	//=======//
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
		
		// Insert children
		state.cells.splice(id, 1, ...children)

		return children
	}
	

	//=========//
	// ELEMENT //
	//=========//
	const BEHAVE = new Map()

	BEHAVE.set(Colour.Yellow.splash, (cell, id) => {
				
		const [down, downId] = pickCell(cell.x, cell.y + cell.height)
		if (down === undefined) return
		if (down.colour === Colour.Black.splash) {
			down.colour = Colour.Yellow.splash
			cell.colour = Colour.Black.splash
			drawCell(down)
			drawCell(cell)
		}

	})

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

})
