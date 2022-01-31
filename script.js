
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

	const centerX = left + width/2
	const centerY = top + height/2

	const sections = []
	const lastDraw = undefined
	//const lastDrawCount = 1
	const lastDrawRepeat = 0

	const cell = {x, y, width, height, colour, left, right, top, bottom, centerX, centerY, sections, size, lastDraw, lastDrawRepeat}
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
		count: 100,
		dynamic: false,
		aer: 2.0,
		redraw: 300.0,
		redrawRepeatScore: 1.0,
		redrawRepeatPenalty: 0.0,
	},

	speed: {
		count: 4096 * 0.25,
		dynamic: false,
		//aer: 1.0,
		redraw: 1.0,
		redrawRepeatScore: 0.5,
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

		scale: 0.9,
		mscale: 1.0,
		dmscale: 0.002,

		mscaleTarget: 1.0,
		mscaleTargetControl: 0.001,
		mscaleTargetSpeed: 0.05,

	},

	brush: {
		colour: 999,
		colour: Colour.Grey.splash,
		colour: Colour.Purple.splash,
		colour: Colour.Rose.splash,
		colour: Colour.Yellow.splash,
		size: 1,
	},

	cursor: {
		previous: { 
			x: undefined,
			y: undefined,
		},
	},

	dragon: {
		behaves: [],
	}
}

const WORLD_SIZE = 6
const WORLD_CELL_COUNT = 2 ** (WORLD_SIZE*2)
const WORLD_DIMENSION = 2 ** WORLD_SIZE
const WORLD_CELL_SIZE = 1 / WORLD_DIMENSION

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
// NOTE: GRID_SIZE MUST BE BIG ENOUGH SO THAT SECTIONS ARE SMALLER OR EQUAL TO WORLD CELLS
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
	const show = Show.start({paused: false})
	const {context, canvas} = show
	canvas.style["position"] = "absolute"
	
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

	state.camera.x += (canvas.width - state.image.size) / 2
	state.camera.y += (canvas.height - state.image.size) / 2

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

		updateHand()
		updateBrush()
		updatePan()

		const [x, y] = Mouse.position
		state.cursor.previous.x = x
		state.cursor.previous.y = y
		
	}

	const updateBrush = () => {
		if (state.colourTode.hand.state !== HAND.BRUSHING) return
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
		let cell = pickCell(x, y)
		if (cell === undefined) return

		// TODO: this should just merge it together!
		if (cell.width !== WORLD_CELL_SIZE || cell.height != WORLD_CELL_SIZE) {
			const worldCells = getWorldCellsSet(x, y)
			if (worldCells === undefined) return
			const merged = mergeCells([...worldCells])
			cell = merged
		}

		if (typeof state.brush.colour === "number") {
			cell.colour = state.brush.colour
			drawCell(cell)
			return
		}

		const children = splitCellToDiagram(cell, state.brush.colour)

		for (const child of children) {
			drawCell(child)
		}

	}


	const getWorldCellsSet = (x, y) => {

		const snappedX = Math.floor(x*WORLD_DIMENSION) / WORLD_DIMENSION
		const snappedY = Math.floor(y*WORLD_DIMENSION) / WORLD_DIMENSION

		const sectionSizeScale = GRID_SIZE / WORLD_DIMENSION

		const sections = new Set()
		for (let wx = 0; wx < sectionSizeScale; wx++) {
			const gridX = Math.floor((snappedX + wx * WORLD_CELL_SIZE / sectionSizeScale) * GRID_SIZE)
			for (let wy = 0; wy < sectionSizeScale; wy++) {
				const gridY = Math.floor((snappedY + wy * WORLD_CELL_SIZE / sectionSizeScale) * GRID_SIZE)
				const sectionId = gridX*GRID_SIZE + gridY
				const section = state.grid[sectionId]
				sections.add(section)
			}
		}

		const worldCells = new Set()

		// Check if any cells in these sections overlap with an outer section
		for (const section of sections.values()) {
			for (const cell of section.values()) {
				for (const cellSection of cell.sections) {
					if (!sections.has(cellSection)) return undefined
				}
				worldCells.add(cell)
			}
		}

		return worldCells

	}

	const updatePan = () => {
		if (!Mouse.Right) return
		const [x, y] = Mouse.position
		const {x: px, y: py} = state.cursor.previous
		if (px === undefined || py === undefined) return
		if (x === undefined || y === undefined) return
		const [dx, dy] = [x - px, y - py]
		state.camera.x += dx / state.camera.scale
		state.camera.y += dy / state.camera.scale
		updateImageSize()
	}

	const ZOOM = 0.05
	on.mousewheel((e) => {

		const dy = e.deltaY / 100

		doZoom(dy, ...Mouse.position)
		
	})

	const doZoom = (dy, centerX, centerY) => {

		const sign = -Math.sign(dy)
		const d = Math.abs(dy)


		for (let i = 0; i < d; i++) {

			const oldScale = state.camera.scale
			const zoom = ZOOM * state.camera.scale

			const szoom = zoom * sign
			state.camera.scale += szoom

			const newScale = state.camera.scale
			const scale = newScale / oldScale

			state.camera.x += (1-scale) * centerX/newScale
			state.camera.y += (1-scale) * centerY/newScale

		}

		//const newScale = state.camera.scale
		//const scale = newScale / oldScale
		//stampScale(scale)

		updateImageSize()
	}

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
		//state.dragon.behaves.shuffle()
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

		if (BUILD_WORLD(cell, redraw) !== undefined) return 1

		state.dragon.behaves.shuffle()
		for (const behave of state.dragon.behaves) {
			const result = behave(cell, redraw)
			if (result === undefined) continue
			//if (result === 0) continue
			return result
		}
		return 0

		/*for (let i = 0; i < state.dragon.behaves.length; i++) {
			const b = Random.Uint32 % state.dragon.behaves.length
			const behave = state.dragon.behaves[b]
			const result = behave(cell, redraw)
			if (result !== 0) return result
		}*/

		/*const b = Random.Uint32 % state.dragon.behaves.length
		const behave = state.dragon.behaves[b]
		const result = behave(cell, redraw)
		return result*/

		/*const behave = BEHAVE.get(cell.colour)
		if (behave !== undefined) {
			const drawn = behave(cell, redraw)
			if (drawn > 0) return drawn
		}*/

		/*let drawn = 0
		drawn += DEBUG_RED_SPLIT_2(cell, redraw)
		//DEBUG_RED_SPLIT(cell, redraw)
		//DEBUG_FIZZ(cell, redraw)
		//DEBUG_DRIFT(cell, redraw)

		if (drawn > 0) return drawn

		if (redraw) {
			return drawCell(cell)
		}

		return 0*/

	}
	
	//===============//
	// SPLIT + MERGE //
	//===============//
	const splitCell = (cell, width, height) => {


		const wSign = Math.sign(width)
		const hSign = Math.sign(height)

		width = Math.abs(width)
		height = Math.abs(height)

		const childWidth = cell.width / width
		const childHeight = cell.height / height

		const children = []

		const xStart = wSign === 1? cell.x : cell.right-childWidth
		const yStart = hSign === 1? cell.y : cell.bottom-childHeight
		const dx = wSign * childWidth
		const dy = hSign * childHeight
		
		for (let ix = 0; ix < width; ix++) {
			const x = xStart + dx*ix
			for (let iy = 0; iy < height; iy++) {
				const y = yStart + dy*iy
				const child = makeCell({x, y, width: childWidth, height: childHeight, colour: cell.colour, lastDraw: cell.lastDraw})
				children.push(child)
			}
		}

		deleteCell(cell)
		for (const child of children) {
			addCell(child)
		}

		return children
	}
	
	const splitCellToDiagram = (cell, diagram) => {

		const [diagramWidth, diagramHeight] = getDiagramDimensions(diagram)
		const widthScale = cell.width / diagramWidth
		const heightScale = cell.height / diagramHeight

		const children = []
		for (const diagramCell of diagram.left) {

			const colours = getSplashesArrayFromArray(diagramCell.content)
			const colour = colours[Random.Uint32 % colours.length]

			const child = makeCell({
				x: cell.x + diagramCell.x * widthScale,
				y: cell.y + diagramCell.y * heightScale,
				width: diagramCell.width * widthScale,
				height: diagramCell.height * heightScale,
				colour: colour,
			})

			children.push(child)
		}

		deleteCell(cell)
		for (const child of children) {
			addCell(child)
		}

		return children

	}

	const getDiagramDimensions = (diagram) => {

		let left = Infinity
		let right = -Infinity
		let top = Infinity
		let bottom = -Infinity

		for (const cell of diagram.left) {

			const cleft = cell.x
			const cright = cell.x + cell.width
			const ctop = cell.y
			const cbottom = cell.y + cell.height

			if (cleft < left) left = cleft
			if (ctop < top) top = ctop
			if (cright > right) right = cright
			if (cbottom > bottom) bottom = cbottom
		}

		const width = right - left
		const height = bottom - top

		return [width, height]
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
			lastDraw: cells[0].lastDraw,
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
		if (state.worldBuilt) return undefined
		if (state.cellCount >= WORLD_CELL_COUNT) {
			state.worldBuilt = true
			return undefined
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

			cell.colour = Math.max(11, Math.round(cell.colour))
			if (redraw) drawn += drawCell(cell)

			/*const ns = [...neighbours.values()]

			if (!aligns([cell, ...ns]) || !fits([cell, ns[0], ns[2]]) || !fits([ns[0], ns[1]]) || !fits([ns[1], ns[2]])) return 0

			const merged = mergeCells([cell, ...ns])
			merged.colour = Math.max(11, Math.round((cell.colour + ns[0].colour) / 2))
			//merged.colour = Math.max(11, Random.Uint8 % 100)
			if (redraw) drawn += drawCell(merged)
			*/

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

	//=================//
	// DRAGON - NUMBER //
	//=================//
	// Values[10] - what values this number could represent
	// Channel - what colour channel this number uses as its base (0, 1 or 2)
	// Operations[] - any operations that this number includes
	makeNumber = ({values, channel = 0, operations = []} = {}) => {
		let numberValues = undefined
		if (typeof values === "function") numberValues = [false, false, false, false, false, false, false, false, false, false]
		else numberValues = values
		return {values: numberValues, channel, operations}
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
	// I'm not actually sure when this would be used, or if it would be used at all
	// So don't bother making it yet, because it might be useless
	// Cos like... surely this stuff would be PRE-calculated anyway?????
	const evaluateNumber = (number, array) => {

		// TODO: evaluate channel
		const source = array.channels[number.channel]

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

	const makeArrayFromSplash = (splash) => {
		let [r, g, b] = getRGB(splash)
		r /= 100
		g /= 10
		const redValues = [false, false, false, false, false, false, false, false, false, false]
		const greenValues = [false, false, false, false, false, false, false, false, false, false]
		const blueValues = [false, false, false, false, false, false, false, false, false, false]
		redValues[r] = true
		greenValues[g] = true
		blueValues[b] = true
		const red = makeNumber({values: redValues, channel: 0})
		const green = makeNumber({values: greenValues, channel: 1})
		const blue = makeNumber({values: blueValues, channel: 2})

		const array = makeArray({channels: [red, green, blue]})
		return array
	}
	
	const getSplashesSetFromArray = (array) => {

		const splashes = new Set()
		const [reds, greens, blues] = array.channels

		for (let r = 0; r < reds.values.length; r++) {
			const red = reds.values[r]
			if (!red) continue
			for (let g = 0; g < greens.values.length; g++) {
				const green = greens.values[g]
				if (!green) continue
				for (let b = 0; b < blues.values.length; b++) {
					const blue = blues.values[b]
					if (!blue) continue
					const splash = r*100 + g*10 + b*1
					splashes.add(splash)
				}
			}
		}

		return splashes
	}
	
	const getSplashesArrayFromArray = (array) => {

		const splashes = []
		const [reds, greens, blues] = array.channels

		for (let r = 0; r < reds.values.length; r++) {
			const red = reds.values[r]
			if (!red) continue
			for (let g = 0; g < greens.values.length; g++) {
				const green = greens.values[g]
				if (!green) continue
				for (let b = 0; b < blues.values.length; b++) {
					const blue = blues.values[b]
					if (!blue) continue
					const splash = r*100 + g*10 + b*1
					splashes.push(splash)
				}
			}
		}

		return splashes
	}

	

	//================//
	// DRAGON - SHAPE //
	//================//
	const makeStamp = (shape) => {
		return {shape}
	}

	// TODO: something - maybe related to ColourTode shapes?
	const makeShape = () => {
		return {}
	}

	//==================//
	// DRAGON - DIAGRAM //
	//==================//
	// Note: these functions don't check for safety at all
	// for example, you can make an invalid diagram by having the left and right sides not match
	// or you can make an invalid side by giving it two cells in the same place

	// Right can be undefined to represent a single-sided diagram
	const makeDiagram = ({left = [], right} = {}) => {
		return {left, right, isDiagram: true}
	}

	// Content can be a dragon-array or another dragon-diagram
	const makeDiagramCell = ({x = 0, y = 0, width = 1, height = 1, content = makeArray(), instruction = DRAGON_INSTRUCTION.recolour, splitX = 1, splitY = 1} = {}) => {
		return {x, y, width, height, content, instruction, splitX, splitY}
	}

	//===============//
	// DRAGON - RULE //
	//===============//
	const makeRule = ({steps = [], transformations = DRAGON_TRANSFORMATIONS.NONE, locked = true} = {}) => {
		return {steps, transformations, locked}
	}

	//==========================//
	// DRAGON - TRANSFORMATIONS //
	//==========================//
	const DRAGON_TRANSFORMATIONS = {
		NONE: [
			(x, y, w, h, W, H) => [x, y],
		],
		X: [
			(x, y, w, h, W, H) => [      x, y],
			(x, y, w, h, W, fh) => [-x-w+W, y],
		],
		Y: [
			(x, y, w, h, W, H) => [x,      y],
			(x, y, w, h, W, H) => [x, -y-h+H],
		],
		XY: [
			(x, y, w, h, W, H) => [     x,      y],
			(x, y, w, h, W, H) => [-x-w+W,      y],
			(x, y, w, h, W, H) => [     x, -y-h+H],
			(x, y, w, h, W, H) => [-x-w+W, -y-h+H],
		],
		R: [
			(x, y, w, h, W, H) => [     x,      y],
			(x, y, w, h, W, H) => [-y-h+H,      x],
			(x, y, w, h, W, H) => [-x-w+W, -y-h+H],
			(x, y, w, h, W, H) => [   y-h, -x-w+W],
		],
		XYR: [
			(x, y, w, h, W, H) => [     x,     y],
			(x, y, w, h, W, H) => [-y-h+H,     x],
			(x, y, w, h, W, H) => [-x-w+W, -y-h+H],
			(x, y, w, h, W, H) => [     y, -x-w+W],
			
			(x, y, w, h, W, H) => [-x-w+W,      y],
			(x, y, w, h, W, H) => [-y-h+H, -x-w+W],
			(x, y, w, h, W, H) => [     x, -y-h+H],
			(x, y, w, h, W, H) => [     y,      x],
		]
	}

	const getTransformedRule = (rule, transformation, isTranslation) => {

		// TODO: SHOULD THIS ACTUALLY BE THE MAX SIZE OF ALL STEPS COMBINED???? NOT SURE NEEDS TESTING
		const [ruleWidth, ruleHeight] = getDiagramDimensions(rule.steps[0])

		const steps = rule.steps.map(step => getTransformedDiagram(step, transformation, isTranslation, ruleWidth, ruleHeight))

		const transformedRule = makeRule({steps, transformations: rule.transformations, locked: rule.locked})
		return transformedRule
	}

	const getTransformedDiagram = (diagram, transformation, isTranslation, ruleWidth, ruleHeight) => {

		const {left, right} = diagram
		const [diagramWidth, diagramHeight] = [ruleWidth, ruleHeight]

		const transformedLeft = []
		const transformedRight = right === undefined? undefined : []

		for (let i = 0; i < left.length; i++) {
			const leftCell = left[i]
			const transformedLeftCell = getTransformedCell(leftCell, transformation, diagramWidth, diagramHeight, isTranslation)
			transformedLeft.push(transformedLeftCell)
		}

		for (let i = 0; i < right.length; i++) {
			const rightCell = right[i]
			const transformedRightCell = getTransformedCell(rightCell, transformation, diagramWidth, diagramHeight, isTranslation)
			transformedRight.push(transformedRightCell)
		}

		const transformedDiagram = makeDiagram({left: transformedLeft, right: transformedRight})
		return transformedDiagram
	}

	const getTransformedCell = (cell, transformation, diagramWidth, diagramHeight, isTranslation = false) => {

		let [x, y, width, height] = transformation(cell.x, cell.y, cell.width, cell.height, diagramWidth, diagramHeight)
		
		let {splitX, splitY} = cell
		if (!isTranslation) {
			const [newSplitX, newSplitY] = transformation(cell.splitX, cell.splitY, 1, 1, 1, 1)
			splitX = newSplitX
			splitY = newSplitY
		}

		if (x === undefined) x = cell.x
		if (y === undefined) y = cell.y
		if (width === undefined) width = cell.width
		if (height === undefined) height = cell.height
		
		// leftover from when content could be a sub-diagram
		//const content = cell.content.isDiagram? getTransformedDiagram(cell.content, transformation) : cell.content
		const content = cell.content

		return makeDiagramCell({x, y, splitX, splitY, width, height, content, instruction: cell.instruction})
	}

	//=================//
	// DRAGON - BEHAVE //
	//=================//
	// From a rule, register 'behave' functions that get used to implement the rules in the engine
	// Note: This function doesn't check for safety
	// eg: If it is a locked-in rule or not
	// Or if the left side matches the shape of the right side
	const registerRule = (rule) => {

		// Apply Symmetry!
		const transformedRules = []
		for (const transformation of rule.transformations) {
			const transformedRule = getTransformedRule(rule, transformation)
			transformedRules.push(transformedRule)
		}

		// Get Redundant Rules!
		const redundantRules = []
		for (const transformedRule of transformedRules) {
			const _redundantRules = getRedundantRules(transformedRule)
			redundantRules.push(..._redundantRules)
		}

		// Make behave functions!!!
		for (const redundantRule of redundantRules) {
			const behaveFunction = makeBehaveFunction(redundantRule)
			state.dragon.behaves.push(behaveFunction)
		}

		return [redundantRules, transformedRules]

	}

	// For one rule, we could take its 'origin' as any of the cells in the first step
	// This function gets all those redundant variations
	const getRedundantRules = (rule) => {
		
		const redundantRules = []
		const [head] = rule.steps

		for (const cell of head.left) {
			const transformation = (x, y, width = 1, height = 1) => {

				const newWidth = width / cell.width
				const newHeight = height / cell.height

				const newX = (x - cell.x) * 1/cell.width
				const newY = (y - cell.y) * 1/cell.height

				return [newX, newY, newWidth, newHeight]

			}
			const redundantRule = getTransformedRule(rule, transformation, true)
			redundantRules.push(redundantRule)
		}

		return redundantRules
		
	}

	const makeBehaveFunction = (rule) => {

		const stepFunctions = []

		for (const step of rule.steps) {

			const conditionFunction = makeConditionFunction(step)
			const resultFunction = makeResultFunction(step)

			const stepFunction = (origin, redraw) => {
				const neighbours = conditionFunction(origin)
				if (neighbours === undefined) return
				return resultFunction(neighbours, redraw)
			}

			stepFunctions.push(stepFunction)

		}

		const behaveFunction = (origin, redraw) => {

			for (const stepFunction of stepFunctions) {
				const drawn = stepFunction(origin, redraw)
				if (drawn !== undefined) return drawn
			}

			return undefined
		}

		return behaveFunction

	}

	const makeConditionFunction = (diagram) => {

		const conditions = []

		for (const cell of diagram.left) {

			const splashes = getSplashesSetFromArray(cell.content)
			
			const condition = (origin) => {
				
				const width = cell.width * origin.width
				const height = cell.height * origin.height

				const x = origin.x + cell.x*origin.width
				const y = origin.y + cell.y*origin.height

				const centerX = x + width/2
				const centerY = y + height/2

				const neighbour = pickCell(centerX, centerY)

				if (neighbour === undefined) return undefined
				if (neighbour.left !== x) return undefined
				if (neighbour.top !== y) return undefined
				if (neighbour.width !== width) return undefined
				if (neighbour.height !== height) return undefined
				if (!splashes.has(neighbour.colour)) return undefined
				
				return neighbour
			}

			conditions.push(condition)
		}

		const conditionFunction = (origin) => {

			const neighbours = []

			for (const condition of conditions) {
				const neighbour = condition(origin)
				if (neighbour === undefined) return
				neighbours.push(neighbour)
			}


			return neighbours
		}

		return conditionFunction
	}

	// TODO: also support Merging (with some funky backend syntax if needed)
	// TODO: also support Splitting (with some funky backend syntax if needed)
	// this funky syntax could include dummy cells on the right
	const makeResultFunction = (diagram) => {

		const results = []
		for (const cell of diagram.right) {
			const result = cell.instruction(cell)
			results.push(result)
		}

		return (neighbours, redraw) => {

			let drawn = 0
			let neighbourId = 0
			let skip = 0
			const bonusTargets = []

			for (const instruction of results) {
				const target = bonusTargets.length > 0? bonusTargets.pop() : neighbours[neighbourId]
				const result = instruction(target, redraw, neighbours, neighbourId)
				const {drawn: resultDrawn, bonusTargets: resultBonusTargets, skip: resultSkip} = result
				if (resultSkip !== undefined) skip += resultSkip
				drawn += resultDrawn
				if (resultBonusTargets !== undefined) {
					bonusTargets.push(...resultBonusTargets)
				}
				
				if (bonusTargets.length === 0) {
					neighbourId++
					if (skip > 0) {
						neighbourId++
						skip--
					}
				}
			}

			return drawn
		}

		return undefined
	}

	const isDiagramCellFullyInside = (cell, target) => {

		const cleft = cell.x
		const ctop = cell.top
		const cright = cell.x + cell.width
		const cbottom = cell.top + cell.height

		const tleft = target.x
		const ttop = target.top
		const tright = target.x + target.width
		const tbottom = target.top + target.height

		if (cleft < tleft) return false
		if (ctop < ttop) return false
		if (cbottom > tbottom) return false
		if (cright > tright) return false

		return true

	}

	//======================//
	// DRAGON - INSTRUCTION //
	//======================//
	// These are the different types of instructions available for the right-hand-side of rules
	// Default is recolour
	const DRAGON_INSTRUCTION = {}
	DRAGON_INSTRUCTION.recolour = (cell) => {

		const splashes = getSplashesArrayFromArray(cell.content)

		const instruction = (target, redraw) => {

			const colour = splashes[Random.Uint32 % splashes.length]

			let drawn = 0
			if (redraw) drawn += setCellColour(target, colour, true)
			else target.colour = colour

			return {drawn}
		}

		return instruction
	}

	// A SPLIT REQUIRES THE CORRECT NUMBER OF RECOLOUR COMMANDS AFTER IT
	// IF YOU DON'T, IT WILL GO WRONG
	DRAGON_INSTRUCTION.split = (cell) => {

		const splashes = getSplashesArrayFromArray(cell.content)

		const instruction = (target, redraw) => {
			
			const children = splitCell(target, cell.splitX, cell.splitY)
			const [head, ...tail] = children

			const colour = splashes[Random.Uint32 % splashes.length]
			let drawn = 0
			if (redraw) drawn += setCellColour(head, colour, true)
			else head.colour = colour

			return {drawn, bonusTargets: tail}

		}
		return instruction

	}

	DRAGON_INSTRUCTION.merge = (cell) => {

		const splashes = getSplashesArrayFromArray(cell.content)
		
		const childCount = Math.abs(cell.splitX) * Math.abs(cell.splitY)

		const instruction = (target, redraw, neighbours, neighbourId) => {

			const children = neighbours.slice(neighbourId, neighbourId+childCount)
			const merged = mergeCells(children)

			const colour = splashes[Random.Uint32 % splashes.length]
			let drawn = 0
			if (redraw) drawn += setCellColour(merged, colour)
			else merged.colour = colour

			return {drawn, skip: childCount-1}

		}

		return instruction

	}

	//=================//
	// DRAGON - ORIGIN //
	//=================//
	// The origin is the cell at (0,0) of the first step of a rule
	// It is the cell/colour that triggers the rule 
	const getOriginOfRule = (rule) => {
		const head = rule.steps[0]
		return getOriginOfDiagram(head)
	}

	const getOriginOfDiagram = (diagram) => {
		for (const cell of diagram.left) {
			if (cell.x === 0 && cell.y === 0) return cell
		}

	}

	//================//
	// DRAGON - DEBUG //
	//================//
	const debugRegistry = (registry) => {
		const [debugged, transformed] = registry
		for (const rule of debugged) {
			print("REDUNDANT RULE")
			for (const step of rule.steps) {
				print("STEP >>")
				print("left")
				for (const cell of step.left) {
					cell.d
				}
				print("right")
				for (const cell of step.right) {
					cell.d
				}
			}
		}
		print("")
		for (const rule of transformed) {
			print("TRANSFORMED RULE")
			for (const step of rule.steps) {
				print("STEP >>")
				print("left")
				for (const cell of step.left) {
					cell.d
				}
				print("right")
				for (const cell of step.right) {
					cell.d
				}
			}
		}
	}

	const GREY = makeArrayFromSplash(Colour.Grey.splash)
	const BLACK = makeArrayFromSplash(Colour.Black.splash)
	const CYAN = makeArrayFromSplash(Colour.Cyan.splash)
	const BLUE = makeArrayFromSplash(Colour.Blue.splash)
	const YELLOW = makeArrayFromSplash(Colour.Yellow.splash)
	const PURPLE = makeArrayFromSplash(Colour.Cyan.splash - 111)
	const RED = makeArrayFromSplash(Colour.Red.splash)
	let [RED_R, RED_G, RED_B] = getRGB(Colour.Red.splash)
	RED_R /= 100
	RED_G /= 10
	/*BLACK.channels[0].values[RED_R] = true
	BLACK.channels[1].values[RED_G] = true
	BLACK.channels[2].values[RED_B] = true*/

	const ROCK_FALL_DIAGRAM = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: GREY}),
			makeDiagramCell({x: 0, y: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLACK}),
			makeDiagramCell({x: 0, y: 1, content: GREY}),
		],
	})
	
	const SAND_FALL_DIAGRAM = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: YELLOW}),
			makeDiagramCell({x: 0, y: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLACK}),
			makeDiagramCell({x: 0, y: 1, content: YELLOW}),
		],
	})
	
	const SAND_SLIDE_DIAGRAM = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: YELLOW}),
			makeDiagramCell({x: 1, y: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLACK}),
			makeDiagramCell({x: 1, y: 1, content: YELLOW}),
		],
	})

	const WATER_RIGHT = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: CYAN}),
			makeDiagramCell({x: 1, y: 0, content: BLUE}),
		],
	})

	const WATER_RIGHT_FALL = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: BLUE}),
			makeDiagramCell({x: 0, y: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLACK}),
			makeDiagramCell({x: 0, y: 1, content: BLUE}),
		],
	})

	const WATER_RIGHT_FLIP = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: PURPLE}),
			makeDiagramCell({x: 1, y: 0, content: CYAN}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: CYAN}),
			makeDiagramCell({x: 1, y: 0, content: PURPLE}),
		],
	})

	const WATER_RIGHT_SLIP = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: BLUE}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 0.5, content: PURPLE, instruction: DRAGON_INSTRUCTION.split, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 0.5, y: 0, width: 0.5, content: CYAN}),
		],
	})

	const WATER_RIGHT_UNSLIP = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: PURPLE}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: CYAN}),
			makeDiagramCell({x: 0, y: 1, width: 2, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 2, content: BLUE, instruction: DRAGON_INSTRUCTION.merge, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 0, y: 1, width: 2, content: BLACK}),
		],
	})

	const WATER_RIGHT_UNSLIPP = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: PURPLE}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: PURPLE}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 2, content: BLUE, instruction: DRAGON_INSTRUCTION.merge, splitX: 2, splitY: 1}),
		],
	})

	const WATER_RIGHT_UNSLIPC = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: CYAN}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: CYAN}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 2, content: BLUE, instruction: DRAGON_INSTRUCTION.merge, splitX: 2, splitY: 1}),
		],
	})

	const WATER_RIGHT_SLIDE = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: PURPLE}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: CYAN}),
			makeDiagramCell({x: 2, y: 0, width: 2, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 2, content: BLACK, instruction: DRAGON_INSTRUCTION.merge, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 2, y: 0, width: 1, content: PURPLE, instruction: DRAGON_INSTRUCTION.split, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 3, y: 0, width: 1, content: CYAN}),
		],
	})

	const WATER_RIGHT_FALL_BLUE = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 0.5, content: BLUE}),
			makeDiagramCell({x: 0.5, y: 0, width: 0.5, content: BLUE}),
			makeDiagramCell({x: 0, y: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 1.0, content: BLACK, instruction: DRAGON_INSTRUCTION.merge, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 0, y: 1, width: 0.5, content: BLUE, instruction: DRAGON_INSTRUCTION.split, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 0.5, y: 1, width: 0.5, content: BLUE}),
		],
	})

	const WATER_RIGHT_FALL_CYAN = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 0.5, content: CYAN}),
			makeDiagramCell({x: 0.5, y: 0, width: 0.5, content: CYAN}),
			makeDiagramCell({x: 0, y: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 1.0, content: BLACK, instruction: DRAGON_INSTRUCTION.merge, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 0, y: 1, width: 0.5, content: CYAN, instruction: DRAGON_INSTRUCTION.split, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 0.5, y: 1, width: 0.5, content: CYAN}),
		],
	})
	

	const WATER_RIGHT_SPIN = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: BLUE}),
			makeDiagramCell({x: 1, y: 0, content: CYAN}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: CYAN}),
			makeDiagramCell({x: 1, y: 0, content: BLUE}),
		],
	})
	
	const WATER_RIGHT_SPAWN_DIAGRAM = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: PURPLE}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 0.5, content: BLUE, instruction: DRAGON_INSTRUCTION.split, splitX: 2, splitY: 1}),
			makeDiagramCell({x: 0.5, y: 0, width: 0.5, content: CYAN, instruction: DRAGON_INSTRUCTION.recolour}),
		],
	})
	
	const WATER_RIGHT_RESPAWN_BLUE = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: BLUE}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: BLUE}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: BLUE}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: CYAN}),
		],
	})
	
	const WATER_RIGHT_RESPAWN_CYAN = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: CYAN}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: CYAN}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: BLUE}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: CYAN}),
		],
	})
	
	registerRule(makeRule({steps: [ROCK_FALL_DIAGRAM], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	registerRule(makeRule({steps: [SAND_FALL_DIAGRAM], transformations: DRAGON_TRANSFORMATIONS.X}))
	registerRule(makeRule({steps: [SAND_SLIDE_DIAGRAM], transformations: DRAGON_TRANSFORMATIONS.X}))

	//registerRule(makeRule({steps: [WATER_RIGHT_SPAWN_DIAGRAM], transformations: DRAGON_TRANSFORMATIONS.X}))
	registerRule(makeRule({steps: [WATER_RIGHT_FALL], transformations: DRAGON_TRANSFORMATIONS.X}))
	registerRule(makeRule({steps: [WATER_RIGHT_SLIP], transformations: DRAGON_TRANSFORMATIONS.X}))
	registerRule(makeRule({steps: [WATER_RIGHT_SLIDE, WATER_RIGHT_FLIP], transformations: DRAGON_TRANSFORMATIONS.X}))
	registerRule(makeRule({steps: [WATER_RIGHT_UNSLIP], transformations: DRAGON_TRANSFORMATIONS.X}))
	registerRule(makeRule({steps: [WATER_RIGHT_UNSLIPP], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	registerRule(makeRule({steps: [WATER_RIGHT_UNSLIPC], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	//registerRule(makeRule({steps: [], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_FALL_CYAN], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	//registerRule(makeRule({steps: [WATER_RIGHT_SLIDE_DIAGRAM, WATER_RIGHT_SPIN], transformations: DRAGON_TRANSFORMATIONS.X}))

	//registerRule(makeRule({steps: [], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_SPIN], transformations: DRAGON_TRANSFORMATIONS.X}))

	const RAINBOW = makeArray()
	RAINBOW.channels = [makeNumber(), makeNumber(), makeNumber()]
	for (let c = 0; c < 3; c++) {
		const channel = RAINBOW.channels[c]
		for (let i = 0; i < 10; i++) {
			if (c === 0 & i > 0) continue
			channel.values[i] = true
		}
	}

	RAINBOW_DIAGRAM = makeDiagram({
		left: [
			makeDiagramCell({content: RAINBOW})
		]
	})

	const RAINBOW2 = makeArray()
	RAINBOW2.channels = [makeNumber(), makeNumber(), makeNumber()]
	for (let c = 0; c < 3; c++) {
		const channel = RAINBOW2.channels[c]
		for (let i = 0; i < 10; i++) {
			if (c === 1 & i > 0) continue
			//if (c === 2 & i > 0) continue
			channel.values[i] = true
		}
	}
	
	RAINBOW_DIAGRAM_2 = makeDiagram({
		left: [
			makeDiagramCell({content: RAINBOW2})
		]
	})

	
	
	const WATER_SPAWN_DIAGRAM_CYAN = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: PURPLE}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: CYAN}),
		],
	})
	
	const WATER_SPAWN_DIAGRAM_BLUE = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: PURPLE}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLUE}),
		],
	})
	
	const WATER_FALL_CYAN = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: CYAN}),
			makeDiagramCell({x: 0, y: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLACK}),
			makeDiagramCell({x: 0, y: 1, content: CYAN}),
		],
	})
	
	const WATER_FALL_BLUE = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: BLUE}),
			makeDiagramCell({x: 0, y: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLACK}),
			makeDiagramCell({x: 0, y: 1, content: BLUE}),
		],
	})

	const WATER_SLIDE_BLUE = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: BLUE}),
			makeDiagramCell({x: 1, y: 0, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLACK}),
			makeDiagramCell({x: 1, y: 0, content: BLUE}),
		],
	})

	const WATER_SLIDE_CYAN = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: CYAN}),
			makeDiagramCell({x: -1, y: 0, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLACK}),
			makeDiagramCell({x: -1, y: 0, content: CYAN}),
		],
	})

	const WATER_SWAP_BLUE = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: BLUE}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: CYAN}),
		],
	})

	const WATER_SWAP_CYAN = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, content: CYAN}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, content: BLUE}),
		],
	})

	/*registerRule(makeRule({steps: [WATER_SPAWN_DIAGRAM_CYAN]}))
	registerRule(makeRule({steps: [WATER_SPAWN_DIAGRAM_BLUE]}))

	registerRule(makeRule({steps: [WATER_FALL_BLUE]}))
	registerRule(makeRule({steps: [WATER_FALL_CYAN]}))

	registerRule(makeRule({steps: [WATER_SLIDE_BLUE, WATER_SWAP_BLUE]}))
	registerRule(makeRule({steps: [WATER_SLIDE_CYAN, WATER_SWAP_CYAN]}))*/
	

	//state.brush.colour = RAINBOW_DIAGRAM_2
	
	state.brush.colour = WATER_RIGHT
	state.brush.colour = Colour.Purple.splash
	state.brush.colour = Colour.Blue.splash
	state.brush.colour = Colour.Yellow.splash

	//====================//
	// COLOURTODE - STATE //
	//====================//
	state.colourTode = {
		atoms: [],
		hand: {
			state: undefined,
			content: undefined,
			offset: {x: 0, y: 0},
			velocity: {x: 0, y: 0},
			velocityHistory: [],
			velocityMemory: 5,
		},
	}
	const hand = state.colourTode.hand

	//====================//
	// COLOURTODE - SETUP //
	//====================//
	const colourTodeCanvas = document.createElement("canvas")
	const colourTodeContext = colourTodeCanvas.getContext("2d")
	
	colourTodeCanvas.style["image-rendering"] = "pixelated"
	colourTodeCanvas.style["position"] = "absolute"
	colourTodeCanvas.style["top"] = "0px"
	
	document.body.append(colourTodeCanvas)

	on.resize(() => {
		colourTodeCanvas.width = innerWidth
		colourTodeCanvas.height = innerHeight
		colourTodeCanvas.style["width"] = innerWidth
		colourTodeCanvas.style["height"] = innerHeight
	})

	trigger("resize")

	//===================//
	// COLOURTODE - TICK //
	//===================//
	const colourTodeTick = () => {

		colourTodeUpdate()
		colourTodeDraw()
		requestAnimationFrame(colourTodeTick)
	}

	const updateHand = () => {
		if (hand.velocityHistory.length >= hand.velocityMemory) {
			hand.velocityHistory.shift()
		}

		if (Mouse.position !== undefined && state.cursor.previous.x !== undefined) {
			const [x, y] = Mouse.position
			const dx = x - state.cursor.previous.x
			const dy = y - state.cursor.previous.y
			const velocity = {x: dx, y: dy}
			hand.velocityHistory.push(velocity)
			const sum = hand.velocityHistory.reduce((a, b) => ({x: a.x+b.x, y: a.y+b.y}), {x:0, y:0})
			const average = {x: sum.x / hand.velocityHistory.length, y: sum.y / hand.velocityHistory.length}
			hand.velocity.x = average.x
			hand.velocity.y = average.y
		}
	}
	
	const COLOURTODE_FRICTION = 0.95
	const colourTodeUpdate = () => {
		
		for (const atom of state.colourTode.atoms) {

			if (hand.content === atom) continue
			
			atom.x += atom.dx
			atom.y += atom.dy

			atom.dx *= COLOURTODE_FRICTION
			atom.dy *= COLOURTODE_FRICTION

		}

	}

	const colourTodeDraw = () => {
		colourTodeContext.clearRect(0, 0, colourTodeCanvas.width, colourTodeCanvas.height)
		for (const atom of state.colourTode.atoms) {
			atom.draw(atom)
		}
	}

	requestAnimationFrame(colourTodeTick)

	//===================//
	// COLOURTODE - HAND //
	//===================//
	const HAND = {}
	HAND.FREE = {
		cursor: "auto",

		mousemove: (e) => {
			const x = e.clientX
			const y = e.clientY
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				if (!Mouse.Left) changeHandState(HAND.HOVER)
				else {
					hand.content = atom
					hand.offset.x = atom.x - x
					hand.offset.y = atom.y - y
					atom.dx = hand.velocity.x
					atom.dy = hand.velocity.y
					changeHandState(HAND.TOUCHING)
				}
				return
			}
			if (x < state.view.left) return
			if (x > state.view.right) return
			if (y < state.view.top) return
			if (y > state.view.bottom) return
			if (Mouse.Left) changeHandState(HAND.BRUSHING)
			else changeHandState(HAND.BRUSH)
		}
	}

	HAND.BRUSH = {
		cursor: "crosshair",
		mousemove: (e) => {
			const x = e.clientX
			const y = e.clientY
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				changeHandState(HAND.HOVER)
				return
			}
			if (x >= state.view.left && x <= state.view.right && y >= state.view.top && y <= state.view.bottom) {
				return
			}
			changeHandState(HAND.FREE)
		},
		mousedown: (e) => {
			changeHandState(HAND.BRUSHING)
		}
	}

	HAND.BRUSHING = {
		cursor: "crosshair",
		mousemove: (e) => {
			const x = e.clientX
			const y = e.clientY
			if (x >= state.view.left && x <= state.view.right && y >= state.view.top && y <= state.view.bottom) {
				return
			}
			changeHandState(HAND.FREE)
		},
		mouseup: (e) => {
			changeHandState(HAND.BRUSH)
		}

	}

	HAND.HOVER = {
		cursor: "pointer",
		
		mousedown: (e) => {

			const atom = getAtom(e.clientX, e.clientY)
			if (atom === undefined) return

			hand.content = atom
			hand.offset.x = atom.x - e.clientX
			hand.offset.y = atom.y - e.clientY
			changeHandState(HAND.TOUCHING)

		},

		mousemove: (e) => {
			const x = e.clientX
			const y = e.clientY
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				return
			}
			if (x >= state.view.left && x <= state.view.right && y >= state.view.top && y <= state.view.bottom) {
				changeHandState(HAND.BRUSH)
				return
			}
			changeHandState(HAND.FREE)
		}
	}

	HAND.TOUCHING = {
		cursor: "pointer",
		mousemove: (e) => {
			changeHandState(HAND.DRAGGING)
			colourTodeCanvas.style["cursor"] = "move"
			HAND.DRAGGING.mousemove(e)
		},
		mouseup: (e) => {
			hand.content = undefined
			changeHandState(HAND.HOVER)
		}
	}

	HAND.DRAGGING = {
		cursor: "move",
		mousemove: (e) => {
			const {x, y} = hand.content
			hand.content.x = e.clientX + hand.offset.x
			hand.content.y = e.clientY + hand.offset.y
			hand.content.dx = hand.velocity.x
			hand.content.dy = hand.velocity.y
		},
		mouseup: (e) => {
			hand.content = undefined
			changeHandState(HAND.FREE)
		}
	}

	const changeHandState = (state) => {
		colourTodeCanvas.style["cursor"] = state.cursor
		hand.state = state
	}

	on.mousedown(e => hand.state.mousedown? hand.state.mousedown(e) : undefined)
	on.mousemove(e => hand.state.mousemove? hand.state.mousemove(e) : undefined)
	on.mouseup(e => hand.state.mouseup? hand.state.mouseup(e) : undefined)

	hand.state = HAND.FREE

	//===================//
	// COLOURTODE - ATOM //
	//===================//
	const makeAtom = ({click = () => {}, drag = () => {}, draw = () => {}, overlaps = () => false, x = 0, y = 0, dx = 0, dy = 0, size = 35, colour = Colour.White, ...properties} = {}) => {
		const atom = {draw, click, drag, overlaps, x, y, dx, dy, size, colour, ...properties}
		return atom
	}

	//======================//
	// COLOURTODE - OVERLAP //
	//======================//
	const getAtom = (x, y) => {
		for (const atom of state.colourTode.atoms) {
			if (atom.overlaps(atom, x, y)) return atom
		}
	}

	//======================//
	// COLOURTODE - ELEMENT //
	//======================//
	const COLOURTODE_SQUARE = {
		draw: (atom) => {
			colourTodeContext.fillStyle = atom.colour
			colourTodeContext.fillRect(atom.x, atom.y, atom.size, atom.size)
		},
		overlaps: (atom, x, y) => {
			const left = atom.x
			const right = atom.x + atom.size
			const top = atom.y
			const bottom = atom.y + atom.size

			if (x < left) return false
			if (y < top) return false
			if (x > right) return false
			if (y > bottom) return false

			return true
		}
	}

	//====================//
	// COLOURTODE - DEBUG //
	//====================//
	state.colourTode.atoms.push(makeAtom(COLOURTODE_SQUARE))


})
