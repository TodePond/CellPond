
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

const getRGB = (splash) => {
	const gb = splash % 100
	let b = gb % 10
	let g = gb - b
	let r = splash - gb
	return [r, g, b]
}

const clamp = (number, min, max) => {
	if (number < min) return min
	if (number > max) return max
	return number
}

//======//
// CELL //
//======//
const makeCell = ({x=0, y=0, width=1, height=1, colour=112} = {}) => {
	
	const left = x
	const right = x+width
	const top = y
	const bottom = y+height
	
	const size = width * height

	const sections = []
	const lastDraw = undefined
	//const lastDrawCount = 1
	const lastDrawRepeat = 0

	const cell = {x, y, width, height, colour, left, right, top, bottom, sections, size, lastDraw, lastDrawRepeat}
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

const pickNeighbour = (cell, dx, dy) => {
	const centerX = cell.left + cell.width/2
	const centerY = cell.top + cell.height/2

	const x = centerX + dx*cell.width
	const y = centerY + dy*cell.height

	const neighbour = pickCell(x, y)
	return neighbour
}

const pickRandomCell = () => {
	const x = Math.random()
	const y = Math.random()
	const cell = pickCell(x, y)
	return cell
}

const pickRandomVisibleCell = () => {
	
	if (!state.view.visible) return undefined
	if (state.view.fullyVisible) return pickRandomCell()
	
	const x = state.region.left + Math.random() * state.region.width
	const y = state.region.top + Math.random() * state.region.height
	const cell = pickCell(x, y)
	return cell
}

//=======//
// STATE //
//=======//
const state = {

	grid: [],
	cellCount: 0,

	ticker: () => {},
	time: 0,
	maxTime: 9999999,

	
	speed: {
		count: 32768/1, //with world size of 7
		dynamic: false,
		aer: 2.0,
		redraw: 0.55,
		redrawRepeatScore: 1.0,
		redrawRepeatPenalty: 0.0,
	},


	speed: {
		count: 400,
		dynamic: false,
		aer: 2.0,
		redraw: 30.0,
		redrawRepeatScore: 1.0,
		redrawRepeatPenalty: 0.0,
	},

	image: {

		data: undefined,
		size: undefined,
		baseSize: undefined,

	},

	view: {

		height: undefined,
		width: undefined,
		iheight: undefined,
		iwidth: undefined,
		
		left: undefined,
		right: undefined,
		top: undefined,
		bottom: undefined,

		visible: true,
		fullyVisible: true,


	},

	region: {
		left: 0.0,
		right: 1.0,
		top: 0.0,
		bottom: 1.0,

		width: 1.0,
		height: 1.0,
	},

	camera: {
		x: 0,
		y: 0,

		dx: 0,
		dy: 0,

		dxTarget: 0,
		dyTarget: 0,
		dsControl: 1,
		dsTargetSpeed: 0.05,

		scale: 1.0,
		mscale: 1.0,
		dmscale: 0.002,

		mscaleTarget: 1.0,
		mscaleTargetControl: 0.001,
		mscaleTargetSpeed: 0.05,

	},

	brush: {
		colour: 999,
		colour: Colour.Yellow.splash,
		colour: Colour.Purple.splash,
		colour: Colour.Rose.splash,
		size: 0,
	},

	cursor: {
		previous: {
			x: undefined,
			y: undefined,
		},
	}
}

const WORLD_SIZE = 4
const WORLD_CELL_COUNT = 2 ** (WORLD_SIZE*2)
const WORLD_CELL_SIZE = 1 / Math.sqrt(WORLD_CELL_COUNT)

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
// Setup World
const world = makeCell({colour: WORLD_SIZE * 111})
addCell(world)

on.load(() => {

	
	// Setup Show
	const show = Show.start({paused: true})
	const {context, canvas, pad} = show
	
	//===============//
	// IMAGE + SIZES //
	//===============//
	const updateImageSize = () => {
		state.image.baseSize = Math.min(canvas.width, canvas.height)
		state.image.size = state.image.baseSize * state.camera.scale

		state.image.left = state.camera.x * state.camera.scale
		state.image.top = state.camera.y * state.camera.scale
		state.image.right = state.image.left + state.image.size
		state.image.bottom = state.image.top + state.image.size

		state.view.left = clamp(state.image.left, 0, canvas.width)
		state.view.top = clamp(state.image.top, 0, canvas.height)
		state.view.right = clamp(state.image.right, 0, canvas.width)
		state.view.bottom = clamp(state.image.bottom, 0, canvas.height)
		
		state.view.width = state.view.right - state.view.left
		state.view.height = state.view.bottom - state.view.top

		state.view.visible = state.view.width > 0 && state.view.height > 0
		state.view.fullyVisible = state.view.left === state.image.left && state.view.right === state.image.right && state.view.top === state.image.top && state.view.bottom === state.image.bottom
		
		state.view.iwidth = Math.ceil(state.view.width)
		state.view.iheight = Math.ceil(state.view.height)

		state.region.left = (state.view.left - state.image.left) / state.image.size
		state.region.right = 1.0 + (state.view.right - state.image.right) / state.image.size
		state.region.top = (state.view.top - state.image.top) / state.image.size
		state.region.bottom = 1.0 + (state.view.bottom - state.image.bottom) / state.image.size

		state.region.width = state.region.right - state.region.left
		state.region.height = state.region.bottom - state.region.top

		//state.image.data = context.getImageData(0, 0, state.image.size.iwidth, state.image.size.iheight)
	}

	const updateImageData = () => {
		state.image.data = context.getImageData(0, 0, canvas.width, canvas.height)
	}

	// Setup ImageData
	context.fillStyle = Colour.Void
	context.fillRect(0, 0, canvas.width, canvas.height)
	updateImageSize()
	updateImageData()

	//======//
	// DRAW //
	//======//
	show.resize = () => {
		context.fillStyle = Colour.Void
		context.fillRect(0, 0, canvas.width, canvas.height)
		updateImageSize()
		updateImageData()
	}

	const stampScale = (scale) => {

		//context.fillStyle = Colour.Void
		//context.fillRect(0, 0, canvas.width, canvas.height)
		//context.drawImage(canvas, 0, 0, canvas.width * scale, canvas.height * scale)


		/*if (scale < 1.0) {
			const growthX = canvas.width - canvas.width * scale
			const growthY = canvas.height - canvas.height * scale
			//context.fillRect(canvas.width - growthX, 0, growthX, canvas.height)
			//context.fillRect(0, canvas.height - growthY, canvas.width, growthY)
		}*/

		updateImageSize()
	}

	const drawCells = () => {
		const cells = getCells()
		for (const cell of cells.values()) {
			setCellColour(cell, cell.colour)
		}
	}

	const drawCell = (cell, override) => {
		return setCellColour(cell, cell.colour, override)
	}

	const isCellVisible = (cell) => {
		if (cell.right <= state.region.left) return false
		if (cell.left >= state.region.right) return false
		if (cell.bottom <= state.region.top) return false
		if (cell.top >= state.region.bottom) return false
		return true
	}

	const setCellColour = (cell, colour, override = false) => {
		
		cell.colour = colour
		if (!isCellVisible(cell)) return 0
		
		if (!override && cell.lastDraw === state.time) {
			cell.lastDrawRepeat += state.speed.redrawRepeatPenalty
			return state.speed.redrawRepeatScore * cell.lastDrawRepeat
		}

		const size = state.image.size
		const imageWidth = canvas.width

		const panX = state.camera.x * state.camera.scale
		const panY = state.camera.y * state.camera.scale

		// Position 
		let left = Math.round(size * cell.left + panX)
		if (left > canvas.width) return 0
		if (left < 0) left = 0

		let top = Math.round(size * cell.top + panY)
		if (top > canvas.height) return 0
		if (top < 0) top = 0

		let right = Math.round(size * cell.right + panX)
		if (right < 0) return 0
		if (right > canvas.width) right = canvas.width

		let bottom = Math.round(size * cell.bottom + panY)
		if (bottom < 0) return 0
		if (bottom > canvas.height) bottom = canvas.height

		// Colour
		const splash = Colour.splash(cell.colour)
		const red = splash[0]
		const green = splash[1]
		const blue = splash[2]

		// Draw
		const iy = imageWidth * 4

		const width = right-left
		const ix = 4
		const sx = width * ix

		//let pixelCount = 0
		let id = (top*imageWidth + left) * 4
		const data = state.image.data.data
		for (let y = top; y < bottom; y++) {
			for (let x = left; x < right; x++) { 
				data[id] = red
				data[id+1] = green
				data[id+2] = blue
				id += 4
				//pixelCount++
			}
			id -= sx
			id += iy
		}

		cell.lastDraw = state.time
		//cell.lastDrawCount = pixelCount
		cell.lastDrawRepeat = 1
		return 1

	}

	//========//
	// CURSOR //
	//========//
	const updateCursor = () => {

		updateBrush()
		updatePan()

		const [x, y] = Mouse.position
		state.cursor.previous.x = x
		state.cursor.previous.y = y
		
	}

	const updateBrush = () => {
		if (!Mouse.Left) return
		let [x, y] = getCursorView(...Mouse.position)
		if (x === undefined || y === undefined) {
			return
		}
		
		let [px, py] = getCursorView(state.cursor.previous.x, state.cursor.previous.y)
		
		const size = state.brush.size * WORLD_CELL_SIZE

		const dx = x - px
		const dy = y - py

		const sx = Math.sign(dx)
		const sy = Math.sign(dy)

		const ax = Math.abs(dx)
		const ay = Math.abs(dy)

		const biggest = Math.max(ax, ay)

		let ix = 0
		let iy = 0

		if (ax === biggest) {
			iy = (WORLD_CELL_SIZE * sy) * (ay / ax)
			ix = WORLD_CELL_SIZE * sx
		} else {
			ix = (WORLD_CELL_SIZE * sx) * (ax / ay)
			iy = WORLD_CELL_SIZE * sy
		}

		const points = new Set()

		const length = biggest / WORLD_CELL_SIZE

		if (dx === 0 && dy === 0) {
			for (let dx = -size; dx <= size; dx += WORLD_CELL_SIZE) {
				for (let dy = -size; dy <= size; dy += WORLD_CELL_SIZE) {
					points.add([x + dx, y + dy])
				}
			}
		}
		else for (let i = 0; i <= length; i++) {
			
			const X = px + ix * i
			const Y = py + iy * i

			for (let dx = -size; dx <= size; dx += WORLD_CELL_SIZE) {
				for (let dy = -size; dy <= size; dy += WORLD_CELL_SIZE) {
					points.add([X + dx, Y + dy])
				}
			}

		}

		for (const point of points.values()) {
			brush(point[0], point[1])
		}
		
	}

	const getCursorView = (x, y) => {
		x -= state.camera.x * state.camera.scale
		y -= state.camera.y * state.camera.scale

		x /= state.image.size
		y /= state.image.size

		return [x, y]
	}

	const brush = (x, y) => {
		const cell = pickCell(x, y)
		if (cell === undefined) return
		if (cell.width !== WORLD_CELL_SIZE || cell.height != WORLD_CELL_SIZE) return
		cell.colour = state.brush.colour
		drawCell(cell)
	}

	const updatePan = () => {
		if (!Mouse.Right) return
		const [x, y] = Mouse.position
		const {x: px, y: py} = state.cursor.previous
		if (px === undefined || py === undefined) return
		const [dx, dy] = [x - px, y - py]
		state.camera.x += dx / state.camera.scale
		state.camera.y += dy / state.camera.scale
		updateImageSize()
	}

	const ZOOM = 0.05
	on.mousewheel((e) => {
		const dy = e.deltaY / 100
		const sign = -Math.sign(dy)
		const d = Math.abs(dy)


		for (let i = 0; i < d; i++) {

			const oldScale = state.camera.scale
			const zoom = ZOOM * state.camera.scale

			const szoom = zoom * sign
			state.camera.scale += szoom

			const newScale = state.camera.scale
			const scale = newScale / oldScale

			const centerX = Mouse.position[0]
			const centerY = Mouse.position[1]

			state.camera.x += (1-scale) * centerX/newScale
			state.camera.y += (1-scale) * centerY/newScale

		}

		//const newScale = state.camera.scale
		//const scale = newScale / oldScale
		//stampScale(scale)

		updateImageSize()
	})

	on.contextmenu((e) => {
		e.preventDefault()
	})

	//==========//
	// KEYBOARD //
	//==========//
	on.keydown(e => {
		const keydown = KEYDOWN[e.key]
		if (keydown !== undefined) keydown()
	})

	const KEYDOWN = {}
	KEYDOWN.e = () => state.camera.mscaleTarget += state.camera.mscaleTargetControl
	KEYDOWN.q = () => state.camera.mscaleTarget -= state.camera.mscaleTargetControl
	
	KEYDOWN.w = () => state.camera.dyTarget += state.camera.dsControl
	KEYDOWN.s = () => state.camera.dyTarget -= state.camera.dsControl
	KEYDOWN.a = () => state.camera.dxTarget += state.camera.dsControl
	KEYDOWN.d = () => state.camera.dxTarget -= state.camera.dsControl

	KEYDOWN.r = () => {
		state.camera.mscaleTarget = 1.0
		state.camera.dxTarget = 0.0
		state.camera.dyTarget = 0.0
	}

	//========//
	// CAMERA //
	//========//
	const updateCamera = () => {
		if (state.camera.mscale !== state.camera.mscaleTarget) {

			const d = state.camera.mscaleTarget - state.camera.mscale
			state.camera.mscale += d * state.camera.mscaleTargetSpeed

			const sign = Math.sign(d)
			const snap = state.camera.mscaleTarget * state.camera.mscaleTargetControl * state.camera.mscaleTargetSpeed
			if (sign === 1 && state.camera.mscale > state.camera.mscaleTarget - snap) state.camera.mscale = state.camera.mscaleTarget
			if (sign === -1 && state.camera.mscale < state.camera.mscaleTarget + snap) state.camera.mscale = state.camera.mscaleTarget

		}

		if (state.camera.dx !== state.camera.dxTarget) {

			const d = state.camera.dxTarget - state.camera.dx
			state.camera.dx += d * state.camera.dsTargetSpeed

			const sign = Math.sign(d)
			const snap = state.camera.dxTarget * state.camera.dsControl * state.camera.dsTargetSpeed
			if (sign === 1 && state.camera.dx > state.camera.dxTarget - snap) state.camera.dx = state.camera.dxTarget
			if (sign === -1 && state.camera.dx < state.camera.dxTarget + snap) state.camera.dx = state.camera.dxTarget

		}

		if (state.camera.dy !== state.camera.dyTarget) {

			const d = state.camera.dyTarget - state.camera.dy
			state.camera.dy += d * state.camera.dsTargetSpeed

			const sign = Math.sign(d)
			const snap = state.camera.dyTarget * state.camera.dsControl * state.camera.dsTargetSpeed
			if (sign === 1 && state.camera.dy > state.camera.dyTarget - snap) state.camera.dy = state.camera.dyTarget
			if (sign === -1 && state.camera.dy < state.camera.dyTarget + snap) state.camera.dy = state.camera.dyTarget

		}

		if (state.camera.dx !== 0.0 || state.camera.dy !== 0.0) {
			state.camera.x += state.camera.dx
			state.camera.y += state.camera.dy
			updateImageSize()
		}

		if (state.camera.mscale !== 1.0) {
			const oldScale = state.camera.scale
			state.camera.scale *= state.camera.mscale
			const newScale = state.camera.scale
			const scale = newScale / oldScale

			let centerX = Mouse.position[0]
			let centerY = Mouse.position[1]

			if (centerX === undefined) centerX = canvas.width/2
			if (centerY === undefined) centerY = canvas.height/2

			state.camera.x += (1-scale) * centerX/newScale
			state.camera.y += (1-scale) * centerY/newScale

			updateImageSize()
		}
	}

	//======//
	// TICK //
	//======//
	drawCells()
	show.tick = () => {
		
		updateCursor()
		updateCamera()
		if (!show.paused) fireRandomSpotEvents()
		else fireRandomSpotDrawEvents()
		context.putImageData(state.image.data, 0, 0)

		// Draw void
		context.clearRect(0, 0, state.view.left, state.view.bottom)
		context.clearRect(state.view.left, 0, canvas.width, state.view.top)
		context.clearRect(state.view.right, state.view.top, canvas.width, canvas.height)
		context.clearRect(0, state.view.bottom, canvas.width, canvas.height)

		state.time++
		if (state.time > state.maxTime) state.time = 0

	}

	const fireRandomSpotEvents = () => {
		const count = state.speed.dynamic? state.speed.aer * state.cellCount : state.speed.count
		const redrawCount = count * state.speed.redraw
		let redraw = true
		if (!state.worldBuilt) redraw = false
		let drawnCount = 0
		for (let i = 0; i < count; i++) {
			const cell = pickRandomCell()
			
			if (redraw && drawnCount >= redrawCount) redraw = false
			const drawn = fireCellEvent(cell, redraw)
			drawnCount += drawn
		}

		if (!state.view.visible) return
		while (drawnCount < redrawCount) {
			const cell = pickRandomVisibleCell()
			drawnCount += drawCell(cell)
		}
	}

	const fireRandomSpotDrawEvents = () => {
		if (!state.view.visible) return
		const count = state.speed.dynamic? state.speed.aer * state.cellCount : state.speed.count
		let redrawCount = count * state.speed.redraw
		if (!state.worldBuilt) redrawCount = 1
		let drawnCount = 0
		for (let i = 0; i < redrawCount; i++) {
			const cell = pickRandomVisibleCell()
			drawnCount += drawCell(cell)
		}
	}

	// this function is currently full of debug code
	// Returns the number of cells it drew
	const fireCellEvent = (cell, redraw) => {

		if (BUILD_WORLD(cell, redraw)) return 1

		/*const behave = BEHAVE.get(cell.colour)
		if (behave !== undefined) {
			const drawn = behave(cell, redraw)
			if (drawn > 0) return drawn
		}*/

		let drawn = 0
		drawn += DEBUG_RED_SPLIT_2(cell, redraw)
		//DEBUG_RED_SPLIT(cell, redraw)
		//DEBUG_FIZZ(cell, redraw)
		//DEBUG_DRIFT(cell, redraw)

		if (drawn > 0) return drawn

		if (redraw) {
			return drawCell(cell)
		}

		return 0

	}
	
	//===============//
	// SPLIT + MERGE //
	//===============//
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

	// Warning: bugs will happen if you try to merge cells that don't align or aren't next to each other
	const mergeCells = (cells) => {
		
		let left = 1
		let top = 1
		let right = 0
		let bottom = 0

		for (const cell of cells) {
			if (cell.left < left) left = cell.left
			if (cell.top < top) top = cell.top
			if (cell.right > right) right = cell.right
			if (cell.bottom > bottom) bottom = cell.bottom
			deleteCell(cell)
		}

		const cell = makeCell({
			x: left,
			y: top,
			width: right-left,
			height: bottom-top,
			colour: cells[0].colour,
		})

		addCell(cell)

		return cell

	}

	// NOTE: this checks if the cells fit together in ANY POSSIBLE WAY
	// it might not be the arrangement of cells that you are interested in
	const fits = (cells) => {

		const [head, ...tail] = cells
		
		const connections = [head]
		let failureCount = 0
		
		let i = 0
		while (connections.length <= cells.length) {

			const cell = tail[i]
			const connection = connections.find(connection => isFit(cell, connection))
			if (!connection) {
				failureCount++
				if (failureCount === (cells.length - connections.length)) return false
			} else {
				failureCount = 0
				connections.push(cell)
			}

			i++
			if (i >= tail.length) i = 0
		}

		return true

	}

	// Only checks if cells are the same size
	const aligns = (cells) => {
		
		const [head, ...tail] = cells
		const {width, height} = head
		const isAligned = tail.every(cell => cell.width === width && cell.height === height)
		return isAligned

	}

	const isFit = (cell, connection) => {
		if (cell.height === connection.height && cell.top === connection.top) {
			if (cell.left === connection.right) return true
			if (cell.right === connection.left) return true
		}
		
		if (cell.width === connection.width && cell.right === connection.right) {
			if (cell.top === connection.bottom) return true
			if (cell.bottom === connection.top) return true
		}

		return
	}

	//=========//
	// ELEMENT //
	//=========//
	// Behave functions must return how many cells got drawn

	const BEHAVE = new Map()

	BEHAVE.set(Colour.Yellow.splash, (cell, redraw) => {
		
		if (cell.width !== cell.height) return 0

		const down = pickCell(cell.x + cell.width/2, cell.y + cell.height/2 + cell.height)

		if (down !== undefined && down.colour === Colour.Black.splash) {
			down.colour = Colour.Yellow.splash
			cell.colour = Colour.Black.splash
			let drawn = 0
			drawn += drawCell(down, true)
			drawn += drawCell(cell, true)
			return drawn
		} else {

			const slide = pickNeighbour(cell, oneIn(2)? 1 : -1, 1)
			if (slide === undefined) return 0
			if (slide.colour === Colour.Black.splash) {
				let drawn = 0
				drawn += setCellColour(cell, Colour.Black.splash, true)
				drawn += setCellColour(slide, Colour.Yellow.splash, true)
				return drawn
			}

		}

		return 0

	})

	BEHAVE.set(Colour.Purple.splash, (cell, redraw) => {

		const [left, right] = splitCell(cell, 2, 1)
		let drawn = 0
		drawn += setCellColour(left, Colour.Cyan.splash)
		drawn += setCellColour(right, Colour.Blue.splash)

		return drawn

	})

	BEHAVE.set(Colour.Cyan.splash, (cell, redraw) => {


		// @#
		const right = pickNeighbour(cell, 1, 0)
		if (right !== undefined && aligns([cell, right])) {

			// Fall
			if (right.colour === Colour.Blue.splash || right.colour === Colour.Cyan.splash) {
				const below = pickNeighbour(cell, 0, 1)
				if (below !== undefined && below.colour === Colour.Black.splash) {
					if (below.width === cell.width*2 && below.left === cell.left) {
						const merged = mergeCells([cell, right])
						const [fallenLeft, fallenRight] = splitCell(below, 2, 1)
						let drawn = 0
						drawn += setCellColour(merged, Colour.Black.splash)
						drawn += setCellColour(fallenLeft, cell.colour)
						drawn += setCellColour(fallenRight, right.colour)
						return drawn
					}
				}
			}

			// Slide
			if (right.colour === Colour.Blue.splash) {
				const head = pickNeighbour(right, 1, 0)
				if (head !== undefined && head.colour === Colour.Black.splash && head.width === cell.width*2 && head.left === right.right && head.top === cell.top) {
					const merged = mergeCells([cell, right])
					const [splitLeft, splitRight] = splitCell(head, 2, 1)
					let drawn = 0
					drawn += setCellColour(merged, Colour.Black.splash)
					drawn += setCellColour(splitLeft, cell.colour)
					drawn += setCellColour(splitRight, right.colour)
					return drawn
				}
			}
			
			// Bounce
			if (right.colour === Colour.Cyan.splash || right.colour === Colour.Blue.splash) {
				let drawn = 0
				drawn += setCellColour(cell, Colour.Blue.splash)
				drawn += setCellColour(right, Colour.Cyan.splash)
				return drawn
			}

		}
		
		// #@
		const left = pickNeighbour(cell, -1, 0)
		if (left !== undefined && aligns([cell, left])) {
			
			// Fall
			if (left.colour === Colour.Blue.splash || left.colour === Colour.Cyan.splash) {
				const below = pickNeighbour(cell, 0, 1)
				if (below !== undefined && below.colour === Colour.Black.splash) {
					if (below.width === cell.width*2 && below.right === cell.right) {
						const merged = mergeCells([cell, left])
						const [fallenLeft, fallenRight] = splitCell(below, 2, 1)
						let drawn = 0
						drawn += setCellColour(merged, Colour.Black.splash)
						drawn += setCellColour(fallenLeft, left.colour)
						drawn += setCellColour(fallenRight, cell.colour)
						return drawn
					}
				}
			}

			// Slide
			if (left.colour === Colour.Blue.splash) {
				const head = pickNeighbour(left, -1, 0)
				if (head !== undefined && head.colour === Colour.Black.splash && head.width === cell.width*2 && head.right === left.left && head.top === cell.top) {
					const merged = mergeCells([cell, left])
					const [splitLeft, splitRight] = splitCell(head, 2, 1)
					let drawn = 0
					drawn += setCellColour(merged, Colour.Black.splash)
					drawn += setCellColour(splitLeft, left.colour)
					drawn += setCellColour(splitRight, cell.colour)
					return drawn
				}
			}

			// Bounce
			if (left.colour === Colour.Cyan.splash || left.colour === Colour.Blue.splash) {
				let drawn = 0
				drawn += setCellColour(cell, Colour.Blue.splash)
				drawn += setCellColour(left, Colour.Cyan.splash)
				return drawn
			}

		}

		return 0

	})

	BEHAVE.set(Colour.Blue.splash, (cell, redraw) => {
		// @#
		const right = pickNeighbour(cell, 1, 0)
		if (right !== undefined && aligns([cell, right])) {

			// Fall
			if (right.colour === Colour.Blue.splash || right.colour === Colour.Cyan.splash) {
				const below = pickNeighbour(cell, 0, 1)
				if (below !== undefined && below.colour === Colour.Black.splash) {
					if (below.width === cell.width*2 && below.left === cell.left) {
						const merged = mergeCells([cell, right])
						const [fallenLeft, fallenRight] = splitCell(below, 2, 1)
						let drawn = 0
						drawn += setCellColour(merged, Colour.Black.splash)
						drawn += setCellColour(fallenLeft, cell.colour)
						drawn += setCellColour(fallenRight, right.colour)
						return drawn
					}
				}
			}

			// Slide
			if (right.colour === Colour.Cyan.splash) {
				const head = pickNeighbour(cell, -1, 0)
				if (head !== undefined && head.colour === Colour.Black.splash && head.width === cell.width*2 && head.right === cell.left && head.top === cell.top) {
					const merged = mergeCells([cell, right])
					const [splitLeft, splitRight] = splitCell(head, 2, 1)
					let drawn = 0
					drawn += setCellColour(merged, Colour.Black.splash)
					drawn += setCellColour(splitLeft, cell.colour)
					drawn += setCellColour(splitRight, right.colour)
					return drawn
				}
			}
			
			
			// Bounce
			if (right.colour === Colour.Cyan.splash || right.colour === Colour.Blue.splash) {
				let drawn = 0
				drawn += setCellColour(cell, Colour.Cyan.splash)
				drawn += setCellColour(right, Colour.Blue.splash)
				return drawn
			}

		}
		
		// #@
		const left = pickNeighbour(cell, -1, 0)
		if (left !== undefined && aligns([cell, left])) {
			
			// Fall
			if (left.colour === Colour.Blue.splash || left.colour === Colour.Cyan.splash) {
				const below = pickNeighbour(cell, 0, 1)
				if (below !== undefined && below.colour === Colour.Black.splash) {
					if (below.width === cell.width*2 && below.right === cell.right) {
						const merged = mergeCells([cell, left])
						const [fallenLeft, fallenRight] = splitCell(below, 2, 1)
						let drawn = 0
						drawn += setCellColour(merged, Colour.Black.splash)
						drawn += setCellColour(fallenLeft, left.colour)
						drawn += setCellColour(fallenRight, cell.colour)
						return drawn
					}
				}
			}
			

			// Slide
			if (left.colour === Colour.Cyan.splash) {
				const head = pickNeighbour(cell, 1, 0)
				if (head !== undefined && head.colour === Colour.Black.splash && head.width === cell.width*2 && head.left === cell.right && head.top === cell.top) {
					const merged = mergeCells([cell, left])
					const [splitLeft, splitRight] = splitCell(head, 2, 1)
					let drawn = 0
					drawn += setCellColour(merged, Colour.Black.splash)
					drawn += setCellColour(splitLeft, left.colour)
					drawn += setCellColour(splitRight, cell.colour)
					return drawn
				}
			}

			// Bounce
			if (left.colour === Colour.Cyan.splash || left.colour === Colour.Blue.splash) {
				let drawn = 0
				drawn += setCellColour(cell, Colour.Cyan.splash)
				drawn += setCellColour(left, Colour.Blue.splash)
				return drawn
			}


		}

		return 0
	})

	BEHAVE.set(Colour.Rose.splash, (cell, redraw) => {
		const [nx, ny] = DEBUG_RED_SPLIT_NEIGHBOURS[Random.Uint8 % 4]
		const neighbour = pickNeighbour(cell, nx, ny)
		if (neighbour === undefined) return 0
		if (neighbour.width !== cell.width) return 0
		if (neighbour.height !== cell.height) return 0
		let drawn = 0
		drawn += setCellColour(neighbour, Colour.Rose.splash)
		return drawn
	})

	/*BEHAVE.set(Colour.Black.splash, (cell, redraw) => {
		return setCellColour(cell, Colour.Rose.splash)
	})*/

	const BUILD_WORLD = (cell, redraw) => {
		if (state.worldBuilt) return 0
		if (state.cellCount >= WORLD_CELL_COUNT) {
			state.worldBuilt = true
			return 0
		}

		if (cell.colour < 111) {
			return 0
		}

		cell.colour -= 111
		const width = 2
		const height = 2
		const children = splitCell(cell, width, height)
		for (const child of children) {
			drawCell(child)
		}

		return 1
	}

	const DEBUG_RED_SPLIT_NEIGHBOURS = [
		[ 1, 0],
		[-1, 0],
		[ 0, 1],
		[ 0,-1],
	]

	const DEBUG_RED_SPLIT_NEIGHBOURS_2 = [
		[[ 1, 0], [ 1, 1], [ 0, 1]],
		[[-1, 0], [-1, 1], [ 0, 1]],
		[[-1, 0], [-1,-1], [ 0,-1]],
		[[ 1, 0], [ 1,-1], [ 0,-1]],
	]

	const DEBUG_RED_SPLIT_2 = (cell, redraw) => {

		if (!state.worldBuilt) return 0

		let [red, green, blue] = getRGB(cell.colour)

		let drawn = 0
		if (red === 0) {

			if (green === 0 && blue === 0) return 0

			const neighbourhood = DEBUG_RED_SPLIT_NEIGHBOURS_2[Random.Uint8 % 4]

			const neighbours = new Set()

			for (const [nx, ny] of neighbourhood) {
				
				const neighbour = pickNeighbour(cell, nx, ny)
				
				if (neighbour === undefined) return 0

				let [nr, ng, nb] = getRGB(neighbour.colour) 
				if (nr !== 0 || (ng === 0 && nb === 0)) return 0

				neighbours.add(neighbour)
			}

			const ns = [...neighbours.values()]

			if (!aligns([cell, ...ns]) || !fits([cell, ns[0], ns[2]]) || !fits([ns[0], ns[1]]) || !fits([ns[1], ns[2]])) return 0

			const merged = mergeCells([cell, ...ns])
			merged.colour = Math.max(11, Math.round((cell.colour + ns[0].colour) / 2))
			//merged.colour = Math.max(11, Random.Uint8 % 100)
			if (redraw) drawn += drawCell(merged)
			

			return 5

		}

		const children = splitCell(cell, 2, 2)

		for (const child of children) {
			
			let [r, g, b] = getRGB(child.colour)
			r -= 200

			g += oneIn(2)? 10 : -10
			b += oneIn(2)? 1 : -1
			
			r = clamp(r, 0, 900)
			g = clamp(g, 0, 90)
			b = clamp(b, 0, 9)

			child.colour = r+g+b
			if (redraw) drawn += drawCell(child)
		}

		return 5

	}

	const DEBUG_RED_SPLIT = (cell, redraw) => {

		if (!state.worldBuilt) return

		let [red, green, blue] = getRGB(cell.colour)

		if (red === 0) {

			if (green === 0 && blue === 0) {
				if (redraw) drawCell(cell)
				return
			}

			const [nx, ny] = DEBUG_RED_SPLIT_NEIGHBOURS[Random.Uint8 % 4]
			const neighbour = pickNeighbour(cell, nx, ny)
			
			if (neighbour === undefined || !fits([cell, neighbour])) {
				if (redraw) drawCell(cell)
				return
			}

			let [nr, ng, nb] = getRGB(neighbour.colour) 
			if (nr !== 0 || (ng === 0 && nb === 0)) {
				if (redraw) drawCell(cell)
				return
			}

			const merged = mergeCells([cell, neighbour])
			merged.colour = Math.max(11, Math.round((cell.colour + neighbour.colour) / 2))
			//merged.colour = Math.max(11, Random.Uint8 % 100)
			drawCell(merged)

			return
		}

		const children = splitCell(cell, 2, 2)

		for (const child of children) {
			
			let [r, g, b] = getRGB(child.colour)
			r -= 200

			g += oneIn(2)? 10 : -10
			b += oneIn(2)? 1 : -1
			
			r = clamp(r, 0, 900)
			g = clamp(g, 0, 90)
			b = clamp(b, 0, 9)

			child.colour = r+g+b
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
		else {
			let [r, g, b] = getRGB(cell.colour)
			const gb = Random.Uint8 % 100
			/*g += oneIn(2)? 10 : -10
			b += oneIn(2)? 1 : -1
			g = clamp(g, 0, 90)
			b = clamp(b, 0, 9)*/
			setCellColour(cell, r+gb)
			return
		}

		const children = splitCell(cell, width, height)

		for (const child of children) {
			let [r, g, b] = getRGB(child.colour)
			const gb = Random.Uint8 % 100
			/*g += oneIn(2)? 10 : -10
			b += oneIn(2)? 1 : -1
			g = clamp(g, 0, 90)
			b = clamp(b, 0, 9)*/
			setCellColour(child, r+gb)
		}

	}

	const DRIFT_MAX = 2 ** 20
	const DEBUG_DRIFT = (cell, redraw) => {

		if (state.cellCount >= DRIFT_MAX) {
			//if (redraw) drawCell(cell)
			return
		}

		const width = 2
		const height = 2

		const children = splitCell(cell, width, height)
		for (const child of children) {

			const gb = child.colour % 100
			let b = gb % 10
			let r = child.colour - gb
			let g = gb - b
			
			r += oneIn(2)? 100 : -100
			g += oneIn(2)? 10 : -10
			b += oneIn(2)? 1 : -1
	
			r = clamp(r, 0, 900)
			g = clamp(g, 0, 90)
			b = clamp(b, 0, 9)
	
			child.colour = r+g+b

			drawCell(child)
		}

	}

	//========//
	// DRAGON //
	//========//
	{
		//=================//
		// DRAGON - NUMBER //
		//=================//
		// Values[10] - what values this number could represent
		// Channels[3] - what colour channels this number could represent
		// Operations[] - any operations that this number includes
		const makeNumber = ({values, channels, operations = []} = {}) => {
			if (values === undefined) values = [false, false, false, false, false, false, false, false, false, false]
			if (channels === undefined) channels = [false, false, false]
			return {values, channels, operations}
		}

		const DRAGON_NUMBER_OPERATOR = {
			ADD: (left, right) => Math.min(left + right, 9),
			SUBTRACT: (left, right) => Math.max(left - right, 0),
			MULTIPLY: (left, right) => Math.min(left * right, 9),
			DIVIDE: (left, right) => right === 0? 9 : Math.round(left / right),
		}

		const makeOperation = (operator, number) => {
			return {operator, number}
		}

		// Evaluates all .channels and .operations into .values (based on a target dragon array, and target channel)
		const evaluateNumber = (number, array, channel) => {
			// TODO: evaluate references
			// TODO: evaluate operations
			return array
		}

		//================//
		// DRAGON - ARRAY //
		//================//
		// Channels[3] - what dragon numbers are in each colour channel (or undefined for a partial array)
		// Stamp - what shape of stamp the channel has (or undefined for no stamp)
		const makeArray = ({channels, stamp} = {}) => {
			if (channels === undefined) channels = [undefined, undefined, undefined]
			return {channels, stamp}
		}

		//================//
		// DRAGON - SHAPE //
		//================//
		const makeShape = ({draw = ()=>{}, overlaps = ()=>{}} = {}) => {
			return {draw, overlaps}
		}

		// TODO: make draw functions for shapes
		// TODO: make collision detection functions for shapes
		const DRAGON_SHAPE = {
			SQUARE: makeShape(),
			CIRCLE: makeShape(),
			TRIANGLE: makeShape(),
			RECTANGLE: makeShape(),
		}

		//==================//
		// DRAGON - DIAGRAM //
		//==================//
		// Note: these functions don't check for safety at all
		// for example, you can make an invalid diagram by having the left and right sides not match
		// or you can make an invalid side by giving it two cells in the same place

		// Right can be undefined to represent a single-sided diagram
		const makeDiagram = ({left = makeDiagramSide(), right} = {}) => {
			return {left, right}
		}

		const makeDiagramSide = ({cells = []} = {}) => {
			return {cells}
		}

		const makeDiagramCell = ({x = 0, y = 0, array = makeArray()} = {}) => {
			return {x, y, array}
		}

		//===============//
		// DRAGON - RULE //
		//===============//
		const makeRule = ({diagrams = [], symmetry = makeSymmetry(), locked = true} = {}) => {
			return {diagrams, symmetry, locked}
		}

		//===================//
		// DRAGON - SYMMETRY //
		//===================//
		const makeSymmetry = ({x = false, y = false, r = false} = {}) => {
			return {x, y, r}
		}

	}

	

})
