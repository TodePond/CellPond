
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

const pickCell = (x, y) => {

	if (x >= 1) return undefined
	if (y >= 1) return undefined
	if (x <  0) return undefined
	if (y <  0) return undefined

	const gridX = Math.floor(x * GRID_SIZE)
	const gridY = Math.floor(y * GRID_SIZE)
	const sectionId = gridX*GRID_SIZE + gridY
	const section = state.grid[sectionId]

	if (section === undefined) return undefined

	let i = 1
	const size = section.size

	for (const cell of section.values()) {
		if (i === size) return cell
		i++
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

	grid: [],
	cellCount: 0,

	ticker: () => {},
	speed: {
		count: 200,
		dynamic: true,
		aer: 1.0,
		redraw: 0.1,
	},

	size: 1000,

	imageData: undefined,

	brush: {
		colour: Colour.Yellow.splash,
	},
}

const addCell = (cell) => {
	cacheCell(cell)
	state.cellCount++
}

const deleteCell = (cell) => {
	uncacheCell(cell)
	state.cellCount--
}

const getCells = () => {
	const cells = new Set()
	for (const section of state.grid) {
		for (const cell of section.values()) {
			cells.add(cell)
		}
	}
	return cells
}

//======//
// GRID //
//======//
// The grid is basically the screen cut up into smaller sections
// It helps to speed up cell lookup because it gives us a smaller area to search through
// Note: Cells can be in multiple sections if they are big enough :)
const GRID_SIZE = 256
for (let x = 0; x < GRID_SIZE; x++) {
	for (let y = 0; y < GRID_SIZE; y++) {
		const section = new Set()
		state.grid.push(section)
	}
}

const cacheCell = (cell) => {
	const left = Math.floor(cell.left * GRID_SIZE)
	const top = Math.floor(cell.top * GRID_SIZE)
	const right = Math.ceil(cell.right * GRID_SIZE)
	const bottom = Math.ceil(cell.bottom * GRID_SIZE)

	for (let x = left; x < right; x++) {
		for (let y = top; y < bottom; y++) {
			const id = x*GRID_SIZE + y
			if (state.grid[id] === undefined) {
				continue
			}
			state.grid[id].add(cell)
			cell.sections.push(state.grid[id])
		}
	}
}

const uncacheCell = (cell) => {
	for (const section of cell.sections) {
		section.delete(cell)
	}
}

//=======//
// SETUP //
//=======//
const world = makeCell({colour: 777})
addCell(world)

on.load(() => {

	const show = Show.start({paused: true})
	const {context, canvas} = show

	//======//
	// DRAW //
	//======//
	context.fillStyle = Colour.Void
	context.fillRect(0, 0, canvas.width, canvas.height)
	state.imageData = context.getImageData(0, 0, canvas.width, canvas.height)
	state.size = Math.min(canvas.width, canvas.height)

	for (let i = 3; i < state.imageData.data.length; i += 4) {
		state.imageData.data[i] = 255
	}
	
	show.resize = (image) => {
		const size = state.size
		state.size = Math.min(canvas.width, canvas.height)
		const scale = state.size / size
		context.fillStyle = Colour.Void
		context.fillRect(0, 0, canvas.width, canvas.height)
		context.drawImage(image, 0, 0, image.width * scale, image.height * scale)
		state.imageData = context.getImageData(0, 0, canvas.width, canvas.height)
	}

	const drawCells = () => {
		const cells = getCells()
		for (const cell of cells.values()) {
			setCellColour(cell, cell.colour)
		}
	}

	const drawCell = (cell) => {
		setCellColour(cell, cell.colour)
	}

	const setCellColour = (cell, colour) => {
		cell.colour = colour
		const splash = Colour.splash(cell.colour)
		const red = splash[0]
		const green = splash[1]
		const blue = splash[2]

		const left = Math.round(state.size * cell.left)
		const top = Math.round(state.size * cell.top)
		const right = Math.round(state.size * cell.right)
		const bottom = Math.round(state.size * cell.bottom)

		let id = (top*canvas.width + left) * 4
		
		const iy = canvas.width * 4

		const width = right-left
		const sx = width * 4

		const data = state.imageData.data

		for (let y = top; y < bottom; y++) {
			for (let x = left; x < right; x++) { 
				data[id] = red
				data[id+1] = green
				data[id+2] = blue
				id += 4
			}
			id -= sx
			id += iy
		}

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

		x /= state.size
		y /= state.size

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
		if (!show.paused) {
			fireRandomSpotEvents()
		}
		else {
			fireRandomSpotDrawEvents()
		}
		context.putImageData(state.imageData, 0, 0)
	}
	
	const fireRandomSpotEvents = () => {
		const count = state.speed.dynamic? state.speed.aer * state.cellCount : state.speed.count
		const redrawCount = count * state.speed.redraw
		let redraw = true
		for (let i = 0; i < count; i++) {
			if (redraw && i > redrawCount) redraw = false
			const x = Math.random()
			const y = Math.random()
			const cell = pickCell(x, y)
			fireCellEvent(cell, redraw)
		}
	}

	const fireRandomSpotDrawEvents = () => {
		const count = state.speed.dynamic? state.speed.aer * state.cellCount : state.speed.count
		const redrawCount = count * state.speed.redraw
		for (let i = 0; i < redrawCount; i++) {
			const x = Math.random()
			const y = Math.random()
			const cell = pickCell(x, y)
			drawCell(cell)
		}
	}

	// this function is currently full of debug code
	const fireCellEvent = (cell, redraw) => {

		const behave = BEHAVE.get(cell.colour)
		if (behave !== undefined) {
			return behave(cell, redraw)
		}

		//DEBUG_FIZZ(cell)
		DEBUG_WORLD(cell, redraw)
		//DEBUG_DRIFT(cell)

		//if (redraw) drawCell(cell)
		
	}
	
	//=======//
	// SPLIT //
	//=======//
	const splitCell = (cell, width, height) => {

		const childWidth = cell.width / width
		const childHeight = cell.height / height

		const children = []

		let i = 0
		for (let x = cell.x; x < cell.right; x += childWidth) {
			for (let y = cell.y; y < cell.bottom; y += childHeight) {
				const child = makeCell({x, y, width: childWidth, height: childHeight, colour: cell.colour})
				children.push(child)
				i++
			}
		}
		
		deleteCell(cell)
		for (const child of children) {
			addCell(child)
		}

		return children
	}
	

	//=========//
	// ELEMENT //
	//=========//
	const BEHAVE = new Map()

	BEHAVE.set(Colour.Yellow.splash, (cell, redraw) => {
		
		const down = pickCell(cell.x + cell.width/2, cell.y + cell.height/2 + cell.height)
		if (down === undefined) {
			if (redraw) drawCell(cell)
			return
		}
		if (down.colour === Colour.Black.splash) {
			down.colour = Colour.Yellow.splash
			cell.colour = Colour.Black.splash
			drawCell(down)
			drawCell(cell)
			return
		}

		if (redraw) drawCell(cell)

	})

	const DEBUG_WORLD = (cell, redraw) => {
		if (cell.colour < 111) {
			if (redraw) drawCell(cell)
			return
		}
		cell.colour -= 111
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
		/*else {
			const r = cell.colour - (cell.colour % 100)
			const gb = Random.Uint8 % 100
			cell.colour = r + gb
			drawCell(cell)
			return
		}*/

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
