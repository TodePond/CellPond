
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
	
	const left = x
	const right = x+width
	const top = y
	const bottom = y+height

	const sections = []

	const cell = {x, y, width, height, colour, left, right, top, bottom, sections}
	return cell

}

// TODO: make this quicker (it is slow)
const pickCell = (x, y) => {

	const gridX = Math.floor(x * GRID_SIZE)
	const gridY = Math.floor(y * GRID_SIZE)
	const sectionId = gridX*GRID_SIZE + gridY
	const section = state.grid[sectionId]

	for (const cell of section.values()) {
		if (cell.left > x) continue
		if (cell.top > y) continue
		if (cell.right <= x) continue
		if (cell.bottom <= y) continue
		return cell
	}

	return undefined
}

//=======//
// STATE //
//=======//
const state = {

	cells: [],
	grid: [],
	ticker: () => {},
	
	speed: {
		count: 200,
		dynamic: true,
		aer: 1.0,
	},

	brush: {
		colour: Colour.Yellow.splash,
	},
}

//======//
// GRID //
//======//
// The grid is basically the screen cut up into smaller sections
// It helps to speed up cell lookup because it gives us a smaller area to search through
// Note: Cells can be in multiple sections if they are big enough :)
const GRID_SIZE = 100
for (let x = 0; x < GRID_SIZE; x++) {
	for (let y = 0; y < GRID_SIZE; y++) {
		const section = new Set()
		state.grid.push(section)
	}
}

const cacheCell = (cell) => {
	const left = Math.floor(cell.left * GRID_SIZE)
	const top = Math.floor(cell.top * GRID_SIZE)
	const right = (cell.right * GRID_SIZE)
	const bottom = (cell.bottom * GRID_SIZE)

	
	for (let x = left; x < right; x++) {
		for (let y = top; y < bottom; y++) {
			const i = x*GRID_SIZE + y
			const section = state.grid[i]
			if (section === undefined) {
				print(left, top)
				print(i, x, y)
				continue
			}
			section.add(cell)
			cell.sections.push(section)			
			
		}
	}
}


//=======//
// SETUP //
//=======//
const world = makeCell({colour: 777})
cacheCell(world)
state.cells.push(world)

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

		const cell = pickCell(x, y)
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
	
	const FIRE = {}
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
		fireCellEvent(cell)
	}

	const fireRandomSpotEvent = () => {
		const x = Math.random()
		const y = Math.random()
		fireSpotEvent(x, y)
	}

	const fireSpotEvent = (x, y) => {
		const cell = pickCell(x, y)
		fireCellEvent(cell)
	}

	// this function is currently full of debug code
	const fireCellEvent = (cell) => {

		const behave = BEHAVE.get(cell.colour)
		if (behave !== undefined) {
			return behave(cell)
		}

		//DEBUG_FIZZ(cell)
		DEBUG_WORLD(cell)
		//DEBUG_DRIFT(cell)
		
	}
	
	state.fire = FIRE.randomSpotEvents
	
	//=======//
	// SPLIT //
	//=======//
	const splitCell = (cell, width, height) => {
	
		const cellRight = cell.x + cell.width
		const cellBottom = cell.y + cell.height

		const childWidth = cell.width / width
		const childHeight = cell.height / height

		const children = []

		let i = 0
		for (let x = cell.x; x < cellRight; x += childWidth) {
			for (let y = cell.y; y < cellBottom; y += childHeight) {
				const child = makeCell({x, y, width: childWidth, height: childHeight, colour: cell.colour})
				cacheCell(child)
				children.push(child)
				i++
			}
		}
		
		// Insert children
		const id = state.cells.indexOf(cell)
		state.cells.splice(id, 1, ...children)
		for (const section of cell.sections) {
			section.delete(cell)
		}

		return children
	}
	

	//=========//
	// ELEMENT //
	//=========//
	const BEHAVE = new Map()

	BEHAVE.set(Colour.Yellow.splash, (cell) => {
				
		const down = pickCell(cell.x, cell.y + cell.height)
		if (down === undefined) return
		if (down.colour === Colour.Black.splash) {
			down.colour = Colour.Yellow.splash
			cell.colour = Colour.Black.splash
			drawCell(down)
			drawCell(cell)
		}

	})

	const DEBUG_WORLD = (cell) => {
		if (cell.colour < 111) return
		cell.colour -= 111
		drawCell(cell)
		const width = 2
		const height = 2
		const children = splitCell(cell, width, height)
		for (const child of children) {
			drawCell(child)
		}
	}

	const DEBUG_FIZZ = (cell) => {

		let width = 1
		let height = 1

		if (cell.colour >= 100) {
			cell.colour -= 100
			width = 2
			height = 2
		}

		const children = splitCell(cell, width, height)

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

	const DEBUG_DRIFT = (cell) => {

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
		
		const children = splitCell(cell, width, height)
		for (const child of children) {
			drawCell(child)
		}

	}

})
