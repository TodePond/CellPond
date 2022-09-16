
/*

Welcome traveller!
Welcome to the SOURCE of the CellPond.

If you venture further, may tode be with you.
What you are about to discover...
	... is a single javascript file ...
		... of gargantuan size ...
			... over 7000 lines ...
				... globally scoped ...

	>>> There is no room for fear here! <<<

Be brave.
	Trust no comments.
		Trust no names.

A simple seed ... grown into a mountain ...
Coding CellPond is a performance & ritual ...
	and by reading this you JOIN THE CEREMONY ...


=============================================================

	... many months later

	the source of CellPond calls me back

	and it calls you too!


*/

const urlParams = new URLSearchParams(window.location.search)
const NO_SECRET_MODE = urlParams.has("nosecret")
const NO_FOOLS_MODE = urlParams.has("nofools")
const UNLOCK_MODE = urlParams.has("unlock")
if (NO_SECRET_MODE) {
	localStorage.setItem("secretHasAlreadyBeenRevealed", "true")
}

const secretHasAlreadyBeenRevealed = localStorage.getItem("secretHasAlreadyBeenRevealed")


//========//
// COLOUR //
//========//
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

const wrap = (number, min, max) => {
	const length = (max - min)+1
	if (number < min) return wrap(number + length, min, max)
	if (number > max) return wrap(number - length, min, max)
	return number
}

let brushColourCycleIndex = 0
const brushColourCycle = [
	999,

	Colour.Green.splash,
	Colour.Blue.splash,
	Colour.Red.splash,
	Colour.Yellow.splash,

	Colour.Black.splash,
	
	Colour.Rose.splash,
	Colour.Cyan.splash,
	Colour.Orange.splash,
	Colour.Purple.splash,
	Colour.Pink.splash,
	
	Colour.Grey.splash,
	Colour.Silver.splash,
]

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

let edgeMode = 0

const pickCell = (x, y) => {

	/*if (edgeMode === 0) {
		if (x >= 1) return undefined
		if (y >= 1) return undefined
		if (x <  0) return undefined
		if (y <  0) return undefined
	} else if (edgeMode === 1) {
		while (x >= 1) x -= 1
		while (y >= 1) y -= 1
		while (x <  0) x += 1
		while (y <  0) y += 1
	}*/

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
	const values = section.values()

	for (const cell of values) {
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
	const x = Random.Uint32 / 4294967295
	const y = Random.Uint32 / 4294967295
	const cell = pickCell(x, y)
	return cell
}

const pickRandomVisibleCell = () => {
	
	if (!state.view.visible) return undefined
	if (state.view.fullyVisible) return pickRandomCell()
	
	const x = state.region.left + (Random.Uint32 / 4294967295) * state.region.width
	const y = state.region.top + (Random.Uint32 / 4294967295) * state.region.height
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
		count: 4096 * 0.5,
		dynamic: false,
		//aer: 1.0,
		redraw: 2.0,
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

		underScale: 0.9,
		scale: 0.9,
		mscale: 1.0,
		dmscale: 0.002,

		mscaleTarget: 1.0,
		mscaleTargetControl: 0.001,
		mscaleTargetSpeed: 0.05,

	},

	brush: {
		colour: Colour.Purple.splash,
		colour: Colour.Rose.splash,
		colour: Colour.Yellow.splash,
		colour: Colour.Grey.splash,
		colour: Colour.Green.splash,
		colour: 999,
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

let WORLD_SIZE = undefined
let WORLD_CELL_COUNT = undefined
let WORLD_DIMENSION = undefined
let WORLD_CELL_SIZE = undefined
const setWorldSize = (size) => {
	WORLD_SIZE = size
	WORLD_CELL_COUNT = 2 ** (WORLD_SIZE*2)
	WORLD_DIMENSION = 2 ** WORLD_SIZE
	WORLD_CELL_SIZE = 1 / WORLD_DIMENSION
}
setWorldSize(6)

const addCell = (cell) => {
	cacheCell(cell)
	state.cellCount++
}

const deleteCell = (cell) => {
	uncacheCell(cell)
	cell.isDeleted = true
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
const GRID_SIZE = 128
for (let x = 0; x < GRID_SIZE; x++) {
	for (let y = 0; y < GRID_SIZE; y++) {
		const section = new Set()
		state.grid.push(section)
		section.left = x / GRID_SIZE
		section.top = y / GRID_SIZE
		section.right = section.left + 1/GRID_SIZE
		section.bottom = section.top + 1/GRID_SIZE
		section.isSection = true
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

		drawQueueNeedsReset = true
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

	const isSectionVisible = (section) => {
		if (section.right <= state.region.left) return false
		if (section.left >= state.region.right) return false
		if (section.bottom <= state.region.top) return false
		if (section.top >= state.region.bottom) return false
		return true
	}

	const isCellVisible = (cell) => {
		if (cell.right <= state.region.left) return false
		if (cell.left >= state.region.right) return false
		if (cell.bottom <= state.region.top) return false
		if (cell.top >= state.region.bottom) return false
		return true
	}

	const queueCellDraw = (cell, colour) => {
		cell.colour = colour
		if (!isCellVisible(cell)) return 0
		drawQueuePriority.add(cell)
		drawQueue.delete(cell)
		return 0.01
	}

	const setCellColour = (cell, colour, override = false) => {
		if (cell.isDeleted) return 0
		cell.colour = colour
		if (!isCellVisible(cell)) return 0
		
		/*
		if (!override && cell.lastDraw === state.time) {
			cell.lastDrawRepeat += state.speed.redrawRepeatPenalty
			return state.speed.redrawRepeatScore * cell.lastDrawRepeat
		}
		*/

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
		let red = splash[0]
		let green = splash[1]
		let blue = splash[2]

		/*if (!NO_FOOLS_MODE) {
			const average = Math.round((red + green + blue) / 3)
			red = average
			green = average
			blue = average
		}*/

		// Draw
		const iy = imageWidth * 4

		const width = right-left
		const ix = 4
		const sx = width * ix

		//let pixelCount = 0
		let id = (top*imageWidth + left) * 4
		const data = state.image.data.data

		let borderRed = Colour.Void.red
		let borderGreen = Colour.Void.green
		let borderBlue = Colour.Void.blue

		if (width <= 3 || bottom-top <= 3) {
			/*
			borderRed = Colour.Void.red
			borderGreen = Colour.Void.green
			borderBlue = Colour.Void.blue
			*/
			
			borderRed = red
			borderGreen = green
			borderBlue = blue

			for (let y = top; y < bottom; y++) {
				for (let x = left; x < right; x++) { 
					data[id] = red
					data[id+1] = green
					data[id+2] = blue
					id += 4
					//pixelCount++
				}
				id += iy
				id -= sx
			}

			return 1
		}

		const left1 = left + 1
		const right_1 = right - 1
		const top1 = top + 1
		const bottom_1 = bottom - 1

		// DRAW TOP ROW
		data[id] = borderRed
		data[id+1] = borderGreen
		data[id+2] = borderBlue
		id += 4

		for (let x = left1; x < right_1; x++) {
			data[id] = borderRed
			data[id+1] = borderGreen
			data[id+2] = borderBlue
			id += 4
			//pixelCount++
		}

		data[id] = borderRed
		data[id+1] = borderGreen
		data[id+2] = borderBlue
		id += 4
		id -= sx
		id += iy

		// DRAW MIDDLE ROWS
		for (let y = top1; y < bottom_1; y++) {
 
			data[id] = borderRed
			data[id+1] = borderGreen
			data[id+2] = borderBlue
			id += 4

			for (let x = left1; x < right_1; x++) { 
				data[id] = red
				data[id+1] = green
				data[id+2] = blue
				id += 4
				//pixelCount++
			}

			data[id] = borderRed
			data[id+1] = borderGreen
			data[id+2] = borderBlue
			id += 4

			id -= sx
			id += iy
		}

		// DRAW BOTTOM ROW
		data[id] = borderRed
		data[id+1] = borderGreen
		data[id+2] = borderBlue
		id += 4

		for (let x = left1; x < right_1; x++) { 
			data[id] = borderRed
			data[id+1] = borderGreen
			data[id+2] = borderBlue
			id += 4
			//pixelCount++
		}

		data[id] = borderRed
		data[id+1] = borderGreen
		data[id+2] = borderBlue

		/*
		cell.lastDraw = state.time
		//cell.lastDrawCount = pixelCount
		cell.lastDrawRepeat = 1
		*/
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

	let pencilled = false
	const updateBrush = () => {

		if (!state.worldBuilt) return

		if (!Mouse.Middle) {
			pencilled = false
		}

		if (state.colourTode.hand.state !== HAND.BRUSHING && state.colourTode.hand.state !== HAND.PENCILLING) return

		if (Mouse.Middle && !pencilled) {
			const [x, y] = Mouse.position
			brush(...getCursorView(x, y))
			pencilled = true
		}

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
			for (let dx = -size/2; dx <= size/2; dx += WORLD_CELL_SIZE) {
				for (let dy = -size/2; dy <= size/2; dy += WORLD_CELL_SIZE) {
					points.add([x + dx, y + dy])
				}
			}
		}
		else for (let i = 0; i <= length; i++) {
			
			const X = px + ix * i
			const Y = py + iy * i

			for (let dx = -size/2; dx <= size/2; dx += WORLD_CELL_SIZE) {
				for (let dy = -size/2; dy <= size/2; dy += WORLD_CELL_SIZE) {
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

		let children = []
		if (state.brush.colour.left[0].content.isDiagram) {
			children = splitCellToDiagram(cell, state.brush.colour.left[0].content)
		} else {
			children = splitCellToDiagram(cell, state.brush.colour)
		}

		for (const child of children) {
			drawCell(child)
		}

	}


	const getWorldCellsSet = (x, y) => {

		const sections = getSectionsOfWorldCell(x, y)
		const worldCells = getWorldCellsFromSections(sections, x, y)

		return worldCells

	}

	const getSectionsOfWorldCell = (x, y) => {
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

		return sections
	}

	const getWorldCellsFromSections = (sections, x, y) => {

		/*const wleft = x
		const wtop = y
		const wright = x + 1/256
		const wbottom = y + 1/256*/

		const worldCells = new Set()

		// Check if any cells in these sections overlap with an outer section
		for (const section of sections.values()) {

			/*if (section.left >= wleft && section.right <= wright && section.top >= wtop && section.bottom <= wbottom) {
				worldCells.add(section)
				continue
			}*/

			for (const cell of section.values()) {
				if (worldCells.has(cell)) continue
				for (const cellSection of cell.sections) {
					if (!sections.has(cellSection)) return undefined
				}
				worldCells.add(cell)
			}
		}

		return worldCells
	}

	let dropperStartX = undefined
	let dropperStartY = undefined
	let dropperStartT = undefined

	state.brush.hoverColour = Colour.Void

	const updatePan = () => {

		const [x, y] = Mouse.position

		if (hand.state === HAND.BRUSH || hand.state === HAND.BRUSHING || hand.state === HAND.PENCILLING) {
			const cell = pickCell(...getCursorView(x, y))
			if (cell !== undefined)	state.brush.hoverColour = cell.colour
		} else {
			const atom = getAtom(x / CT_SCALE, y / CT_SCALE)

			if (atom !== undefined) {
				if (atom.isSquare || atom === squareTool) {
					state.brush.hoverColour = atom.value
				} else if (atom.isTallRectangle) {
					// TODO: what colour should rectangles set the brush?
				} else {
					state.brush.hoverColour = atom.colour.splash
				}
			} else {
				state.brush.hoverColour = Colour.Void
			}
		}

		if (!Mouse.Right) {

			if (dropperStartX !== undefined) {


				const dropperDistance = Math.hypot(x - dropperStartX, y - dropperStartY)
				const dropperTime = Date.now() - dropperStartT
				if (dropperTime < 100 || dropperDistance <= 0) {
					
					if (state.brush.hoverColour === Colour.Void) {
						brushColourCycleIndex++
						if (brushColourCycleIndex >= brushColourCycle.length) {
							brushColourCycleIndex = 0
						}

						setBrushColour(brushColourCycle[brushColourCycleIndex])
					}

					else {
						setBrushColour(state.brush.hoverColour)
					}

					squareTool.toolbarNeedsColourUpdate = true
				}

				drawQueueNeedsReset = true

			}

			dropperStartX = undefined
			dropperStartY = undefined
			return
		}

		drawQueueNeedsReset = true
		
		if (dropperStartX === undefined) {
			dropperStartX = x
			dropperStartY = y
			dropperStartT = Date.now()
			dropperMovement = 0
		}


		const {x: px, y: py} = state.cursor.previous
		if (px === undefined || py === undefined) return
		if (x === undefined || y === undefined) return
		const [dx, dy] = [x - px, y - py]
		state.camera.x += dx / state.camera.scale
		state.camera.y += dy / state.camera.scale
		updateImageSize()
	}

	const ZOOM = 0.05
	let CT_SCALE = 1.0
	on.wheel((e) => {

		e.preventDefault()

		const dy = e.deltaY / 100

		if (Keyboard.Alt) {
			PADDLE.scroll -= 50 * dy
			positionPaddles()
		}

		else if (Keyboard.Control) {
			CT_SCALE -= dy * 0.1
			const allAtoms = getAllAtoms()
			for (const atom of allAtoms) {
				atom.needsColoursUpdate = true
			}
			squareTool.toolbarNeedsColourUpdate = true
		}
		
		else if (Keyboard.Shift) {
			state.brush.size -= dy
			if (state.brush.size < 0) state.brush.size = 0
		}

		else {
			doZoom(dy, ...Mouse.position)
		}
		
	}, {passive: false})

	on.keydown(e => {
		if (e.key === "Alt") e.preventDefault()
	}, {passive: false})

	const getNeatScale = (underScale) => {
		return underScale
	}

	const doZoom = (dy, centerX, centerY) => {

		const sign = -Math.sign(dy)
		const d = Math.abs(dy)

		for (let i = 0; i < d; i++) {

			const zoom = ZOOM * state.camera.underScale

			const szoom = zoom * sign
			state.camera.underScale += szoom

			const oldScale = state.camera.scale
			const newScale = getNeatScale(state.camera.underScale)
			state.camera.scale = newScale
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

	KEYDOWN[0] = () => setWorldSize(0)
	KEYDOWN[1] = () => setWorldSize(1)
	KEYDOWN[2] = () => setWorldSize(2)
	KEYDOWN[3] = () => setWorldSize(3)
	KEYDOWN[4] = () => setWorldSize(4)
	KEYDOWN[5] = () => setWorldSize(5)
	KEYDOWN[6] = () => setWorldSize(6)
	KEYDOWN[7] = () => setWorldSize(7)
	KEYDOWN[8] = () => setWorldSize(8)
	KEYDOWN[9] = () => setWorldSize(9)

	KEYDOWN.r = () => {
		state.camera.mscaleTarget = 1.0
		state.camera.dxTarget = 0.0
		state.camera.dyTarget = 0.0
	}

	KEYDOWN["="] = () => edgeMode = 1
	KEYDOWN["-"] = () => edgeMode = 0

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
			if (hand.state.camerapan) hand.state.camerapan()
		}

		if (state.camera.mscale !== 1.0) {

			//addAllCellsToDrawQueue()

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
		
		updateHand()
		updateCursor()
		updateCamera()
		
		if (drawQueueNeedsReset) {
			addAllCellsTodrawQueue()
			drawQueueNeedsReset = false
		}

		if (!show.paused) fireRandomSpotEvents()
		else fireRandomSpotDrawEvents()

		context.putImageData(state.image.data, 0, 0)
		//context.filter = "grayscale(100%)"
		//context.drawImage(context.canvas, 0, 0, context.canvas.width, context.canvas.height)

		// Draw void
		context.clearRect(0, 0, state.view.left, state.view.bottom)
		context.clearRect(state.view.left, 0, canvas.width, state.view.top)
		context.clearRect(state.view.right, state.view.top, canvas.width, canvas.height)
		context.clearRect(0, state.view.bottom, canvas.width, canvas.height)

		state.time++
		if (state.time > state.maxTime) state.time = 0

	}

	const drawQueue = new Set()
	const drawQueuePriority = new Set()
	drawQueueNeedsReset = false
	
	const shuffleArray = (array) => {
		for (let i = array.length - 1; i > 0; i--) {
			const r = Random.Uint32 % (i+1)
			;[array[i], array[r]] = [array[r], array[i]]
		}
		return array
	}

	const addAllCellsTodrawQueue = () => {
		drawQueue.clear()
		for (const section of shuffleArray([...state.grid])) {
			if (!isSectionVisible(section)) continue
			for (const cell of section.values()) {
				//if (!isCellVisible(cell)) continue
				drawQueue.add(cell)
			}
		}
	}

	const fireRandomSpotEvents = () => {
		let count = state.speed.dynamic? state.speed.aer * state.cellCount : state.speed.count
		count = Math.min(count, state.cellCount)
		count *= state.worldBuilt? 1 : 0.1
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

		for (const cell of drawQueuePriority) {
			drawnCount += drawCell(cell)
			drawQueuePriority.delete(cell)
			if (drawnCount >= redrawCount) break
		}

		for (const cell of drawQueue) {
			drawnCount += drawCell(cell)
			drawQueue.delete(cell)
			if (drawnCount >= redrawCount) break
		}

		/*
		for (const cell of drawQueue) {
			drawnCount += drawCell(cell)
			drawQueue.shift(cell)
			if (drawnCount >= redrawCount) return
		}
		*/

		/*
		for (const cell of drawQueue) {
			drawnCount += drawCell(cell)
			drawQueue.shift()
			if (drawnCount >= redrawCount) return
		}
		*/

		/*if (!state.view.visible) return
		while (drawnCount < redrawCount) {
			const cell = pickRandomVisibleCell()
			drawnCount += drawCell(cell)
		}*/
	}

	const fireRandomSpotDrawEvents = () => {
		if (!state.view.visible) return
		const count = state.speed.dynamic? state.speed.aer * state.cellCount : state.speed.count
		let redrawCount = count * state.speed.redraw
		if (!state.worldBuilt) redrawCount = 1

		let drawnCount = 0

		for (const cell of drawQueue) {
			drawnCount += drawCell(cell)
			drawQueue.delete(cell)
			if (drawnCount >= redrawCount) break
		}

		/*for (let i = 0; i < redrawCount; i++) {
			const cell = pickRandomVisibleCell()
			drawnCount += drawCell(cell)
		}*/
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

	}
	
	//===============//
	// SPLIT + MERGE //
	//===============//
	const splitCell = (cell, width, height) => {

		const childWidth = cell.width / width
		const childHeight = cell.height / height

		const children = []

		const xStart = cell.x
		const yStart = cell.y
		const dx = childWidth
		const dy = childHeight
		
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

			const colours = getSplashesArrayFromArray(diagramCell.content, {source: cell.colour, debug: true})
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

	// Warning: bugs will happen if you try to merge cells that don't align or aren't next to each other
	const mergeCells = (cells) => {
		
		let left = 1
		let top = 1
		let right = 0
		let bottom = 0

		for (const cell of cells) {
			/*if (cell.isSection) {
				for (const c of cell.values()) {
					if (c.left < left) left = c.left
					if (c.top < top) top = c.top
					if (c.right > right) right = c.right
					if (c.bottom > bottom) bottom = c.bottom
					deleteCell(c)
				}
				continue
			}*/
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

	//=================//
	// DRAGON - NUMBER //
	//=================//
	const makeNumber = ({values, channel = 0, variable, add, subtract} = {}) => {
		let numberValues = undefined
		
		if (variable !== undefined) {
			// placeholder for places in the codebase that don't specify a source!
			numberValues = [true, true, true, true, true, true, true, true, true, true]
			//numberValues = [false, false, false, false, false, false, false, false, false, false]
		}
		
		else numberValues = values
		return {values: numberValues, variable, channel, add, subtract}
	}

	const cloneDragonNumber = (number) => {
		const values = [...number.values]
		const variable = number.variable
		const channel = number.channel
		const add = number.add === undefined? undefined : cloneDragonNumber(number.add)
		const subtract = number.subtract === undefined? undefined : cloneDragonNumber(number.subtract)
		const clone = makeNumber({values, variable, channel, add, subtract})
		return clone
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

	const getFirstAllowedValue = (number) => {
		for (let i = 0; i < 10; i++) {
			const value = number.values[i]
			if (value) return i
		}
	}

	const getNumbersFromDragonValues = (values) => {
		return values.map((v, i) => v? i : v).filter(v => v !== false)
	}

	const makeValuesFromInt = (int) => {
		const values = [false, false, false, false, false, false, false, false, false, false]
		values[int] = true
		return values
	}
	
	const VARIABLE_EVALUATOR = {}
	
	VARIABLE_EVALUATOR.red = (number, {source} = {}) => {
		if (source === undefined) {
			return [true, true, true, true, true, true, true, true, true, true]
		}
		const [r, g, b] = getRGB(source)
		const values = makeValuesFromInt(r / 100)
		return values
	}
	
	VARIABLE_EVALUATOR.green = (number, {source} = {}) => {
		if (source === undefined) {
			return [true, true, true, true, true, true, true, true, true, true]
		}
		const [r, g, b] = getRGB(source)
		const values = makeValuesFromInt(g / 10)
		return values
	}
	
	VARIABLE_EVALUATOR.blue = (number, {source} = {}) => {
		if (source === undefined) {
			return [true, true, true, true, true, true, true, true, true, true]
		}
		const [r, g, b] = getRGB(source)
		const values = makeValuesFromInt(b)
		return values
	}

	const evaluateNumber = (number, args = {}) => {
		if (number.variable === undefined) {
			return number.values
		}

		let results = VARIABLE_EVALUATOR[number.variable](number, args)

		if (number.add !== undefined) {
			results = addChannelToResults(results, number.add, {source: args.source, multiplier: 1})
		}
		if (number.subtract !== undefined) {
			results = addChannelToResults(results, number.subtract, {source: args.source, multiplier: -1})
		}
		
		return results

	}

	//================//
	// DRAGON - ARRAY //
	//================//
	// Channels[3] - what dragon numbers are in each colour channel (or undefined for a partial array)
	// Stamp - what shape of stamp the channel has (or undefined for no stamp)
	const makeArray = ({channels, stamp, joins = []} = {}) => {
		if (channels === undefined) channels = [undefined, undefined, undefined]
		return {channels, stamp, joins}
	}

	makeArrayFromSplash = (splash) => {
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
	
	const getSplashesSetFromArray = (array, args) => {

		const splashesArray = getSplashesArrayFromArray(array, args)

		const splashes = new Set(splashesArray)
		return splashes
	}
	
	const getSplashesArrayFromArray = (array, args = {}) => {

		const splashes = []
		for (const join of array.joins) {
			const joinSplashes = getSplashesArrayFromArray(join)
			splashes.push(...joinSplashes)
		}

		
		if (array.isDiagram) {
			splashes.push(900) // backup in case of a bug in my code - shows red for error(!?)
			return splashes
		 }


		//if (array.channels === undefined) print(array)
		let [reds, greens, blues] = array.channels

		if (reds === undefined) reds = makeNumber({channel: 0, variable: "red"})
		if (greens === undefined) greens = makeNumber({channel: 1, variable: "green"})
		if (blues === undefined) blues = makeNumber({channel: 2, variable: "blue"})

		const rvalues = evaluateNumber(reds, {...args, debug: args.debug})
		const gvalues = evaluateNumber(greens, args)
		const bvalues = evaluateNumber(blues, args)

		for (let r = 0; r < rvalues.length; r++) {
			const red = rvalues[r]
			if (!red) continue
			for (let g = 0; g < gvalues.length; g++) {
				const green = gvalues[g]
				if (!green) continue
				for (let b = 0; b < bvalues.length; b++) {
					const blue = bvalues[b]
					if (!blue) continue
					const splash = r*100 + g*10 + b*1
					splashes.push(splash)
				}
			}
		}

		return splashes
	}

	const fillEmptyChannels = (array) => {
		for (let i = 0; i < 3; i++) {
			if (array.channels[i] !== undefined) continue
			array.channels[i] = makeNumber({
				channel: i,
				variable: CHANNEL_VARIABLES[i],
			})
		}
	}

	const isDragonArrayDynamic = (array) => {
		for (const channel of array.channels) {
			if (channel === undefined) return false
			if (channel.variable !== undefined) return true
		}
		return false
	}

	const cloneDragonArray = (array) => {

		if (array.isDiagram) {
			return cloneDiagram(array)
		}

		let red = undefined
		let green = undefined
		let blue = undefined

		const stamp = array.stamp

		if (array.channels[0] !== undefined) {
			red = cloneDragonNumber(array.channels[0])
		}
		
		if (array.channels[1] !== undefined) {
			green = cloneDragonNumber(array.channels[1])
		}
		
		if (array.channels[2] !== undefined) {
			blue = cloneDragonNumber(array.channels[2])
		}

		const joins = []
		for (const join of array.joins) {
			const joinClone = cloneDragonArray(join)
			joins.push(joinClone)
		}

		const clone = makeArray({stamp, channels: [red, green, blue], joins})
		return clone
	}

	//==================//
	// DRAGON - DIAGRAM //
	//==================//
	// Note: these functions don't check for safety at all
	// for example, you can make an invalid diagram by having the left and right sides not match
	// or you can make an invalid side by giving it two cells in the same place

	// Right can be undefined to represent a single-sided diagram
	makeDiagram = ({left = [], right, joins = []} = {}) => {
		return {left, right, isDiagram: true, joins}
	}

	const cloneDiagram = (diagram) => {
		const clone = makeDiagram()
		for (const sideName of ["left", "right"]) {
			if (diagram[sideName] === undefined) continue
			const side = []
			for (const cell of diagram[sideName]) {
				const cloneCell = cloneDiagramCell(cell)
				side.push(cloneCell)
			}
			clone[sideName] = side
		}
		return clone
	}

	// Content can be a dragon-array or another dragon-diagram
	makeDiagramCell = ({x = 0, y = 0, width = 1, height = 1, content = makeArray(), instruction = DRAGON_INSTRUCTION.recolour, splitX = 1, splitY = 1} = {}) => {
		return {x, y, width, height, content, instruction, splitX, splitY}
	}

	const cloneDiagramCell = (cell) => {
		const content = cloneDragonArray(cell.content)
		return {...cell, content}
	}

	// Make the entire diagram fit within 1x1
	const normaliseDiagram = (diagram) => {
		const [width, height] = getDiagramDimensions(diagram)

		for (const sideName of ["left", "right"]) {
			const side = diagram[sideName]
			if (side === undefined) continue
			for (const diagramCell of side) {
				diagramCell.width /= width
				diagramCell.height /= height
				diagramCell.x /= width
				diagramCell.y /= height
			}
		}

		return diagram
	}

	// Make the SMALLEST cell of a diagram be 1x1
	// Note: doesn't really work if the diagram contains another diagram
	const makeMaximisedDiagram = (diagram) => {

		let smallestWidth = Infinity
		let smallestHeight = Infinity

		for (const sideName of ["left", "right"]) {
			const side = diagram[sideName]
			if (side === undefined) continue
			for (const diagramCell of side) {
				if (diagramCell.width < smallestWidth) {
					smallestWidth = diagramCell.width
				}
				if (diagramCell.height < smallestHeight) {
					smallestHeight = diagramCell.height
				}
			}
		}

		const maximisedDiagram = makeDiagram({joins: diagram.joins})

		for (const sideName of ["left", "right"]) {
			const side = diagram[sideName]
			if (side === undefined) continue
			if (maximisedDiagram[sideName] === undefined) {
				maximisedDiagram[sideName] = []
			}
			for (const diagramCell of side) {
				const maximisedDiagramCell = cloneDiagramCell(diagramCell)
				maximisedDiagramCell.width /= smallestWidth
				maximisedDiagramCell.height /= smallestHeight
				maximisedDiagramCell.x /= smallestWidth
				maximisedDiagramCell.y /= smallestHeight
				maximisedDiagram[sideName].push(maximisedDiagramCell)
			}
		}

		return maximisedDiagram
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

	//===============//
	// DRAGON - RULE //
	//===============//
	makeRule = ({steps = [], transformations = DRAGON_TRANSFORMATIONS.NONE, locked = true, chance} = {}) => {
		return {steps, transformations, locked, chance}
	}

	//==========================//
	// DRAGON - TRANSFORMATIONS //
	//==========================//
	DRAGON_TRANSFORMATIONS = {
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
			(x, y, w, h, W, H) => [     y, -x-w+W],
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

		const transformedRule = makeRule({steps, transformations: rule.transformations, locked: rule.locked, chance: rule.chance})
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

		// Re-order the additional instruction from splitting - so that they are all in order from left-to-right, top-to-bottom
		// This is because the engine passes cells to the instruction in that order
		// (it does this specific static order for performance reasons - rather than dynamically finding the cells in any order you want)
		for (let i = 0; i < transformedRight.length; i++) {
			const diagramCell = transformedRight[i]
			if (diagramCell.instruction.type !== "SPLIT") continue
			const additionalInstructionCount = diagramCell.splitX * diagramCell.splitY
			const additionalInstructions = transformedRight.slice(i+1, i+1+additionalInstructionCount)
			const orderedAdditionalInstructions = getOrderedCellAtoms(additionalInstructions)
			transformedRight.splice(i+1, additionalInstructionCount, ...orderedAdditionalInstructions)
		}

		const transformedDiagram = makeDiagram({left: transformedLeft, right: transformedRight})
		return transformedDiagram
	}

	const getTransformedCell = (cell, transformation, diagramWidth, diagramHeight, isTranslation = false) => {

		let [x, y, width, height] = transformation(cell.x, cell.y, cell.width, cell.height, diagramWidth, diagramHeight)
		
		let {splitX, splitY} = cell

		// Detect rotation, and rotate splitX and splitY if need be
		if (!isTranslation) {
			const [testSplitX, testSplitY] = transformation(cell.splitX, cell.splitY, 1, 1, 1, 1).map(n => Math.abs(n))
			//print(transformation.toString(), splitX, splitY, "to", testSplitX, testSplitY)
			splitX = testSplitX
			splitY = testSplitY
			
			const [testWidth, testHeight] = transformation(cell.width, cell.height, 1, 1, 1, 1).map(n => Math.abs(n))
			//print(transformation.toString(), splitX, splitY, "to", testSplitX, testSplitY)
			width = testWidth
			height = testHeight

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
	registerRule = (rule) => {

		// Apply Symmetry!
		const transformedRules = []
		for (const transformation of rule.transformations) {
			const transformedRule = getTransformedRule(rule, transformation)
			transformedRules.push(transformedRule)
		}

		// Get Redundant Rules!
		const redundantRules = []
		for (const transformedRule of transformedRules) {
			const redundantTransformedRules = getRedundantRules(transformedRule)
			redundantRules.push(...redundantTransformedRules)
		}

		// Make behave functions!!!
		const behaveFunctions = []
		for (const redundantRule of redundantRules) {
			const behaveFunction = makeBehaveFunction(redundantRule)
			behaveFunctions.push(behaveFunction)
			state.dragon.behaves.push(behaveFunction)
		}

		return {redundantRules, transformedRules, behaveFunctions}

	}

	const unregisterRegistry = ({behaveFunctions}) => {
		state.dragon.behaves = state.dragon.behaves.filter(behaveFunction => !behaveFunctions.includes(behaveFunction))
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

	const getStampNamesOfStep = (step) => {
		const stampNames = new Set()
		const sides = [step.left, step.right]
		for (const side of sides) {
			for (const diagramCell of side) {
				const stamp = diagramCell.content.stamp
				if (stamp === undefined) continue
				stampNames.add(stamp)
			}
		}
		return [...stampNames.values()]
	}

	const makeBehaveFunction = (rule) => {
		const stepFunctions = []
		for (const step of rule.steps) {

			const stampNames = getStampNamesOfStep(step)
			const conditionFunction = makeConditionFunction(step, stampNames, rule.chance)
			const resultFunction = makeResultFunction(step, stampNames)

			const stepFunction = (origin, redraw) => {
				const [neighbours, stamps] = conditionFunction(origin)
				if (neighbours === undefined) return
				return resultFunction(neighbours, redraw, stamps)
			}

			stepFunctions.push(stepFunction)

		}

		const behaveFunction = (origin, redraw) => {

			let count = 1
			for (const stepFunction of stepFunctions) {
				const drawn = stepFunction(origin, redraw)
				if (drawn !== undefined) return drawn
			}

			return undefined
		}

		return behaveFunction

	}

	const makeConditionFunction = (diagram, stampNames, chance) => {

		const conditions = []

		for (const cell of diagram.left) {

			const splashes = getSplashesSetFromArray(cell.content)

			const condition = (origin) => {
				
				const width = cell.width * origin.width
				const height = cell.height * origin.height

				let x = origin.x + cell.x*origin.width
				let y = origin.y + cell.y*origin.height

				if (edgeMode === 1) {
					while (x >= 1) x -= 1
					while (y >= 1) y -= 1
					while (x <  0) x += 1
					while (y <  0) y += 1
				}

				const centerX = x + width/2
				const centerY = y + height/2

				const neighbour = pickCell(centerX, centerY)

				if (neighbour === undefined) return [undefined, undefined]
				if (neighbour.left !== x) return [undefined, undefined]
				if (neighbour.top !== y) return [undefined, undefined]
				if (neighbour.width !== width) return [undefined, undefined]
				if (neighbour.height !== height) return [undefined, undefined]
				if (!splashes.has(neighbour.colour)) return [undefined, undefined]
				
				return [neighbour, cell.content.stamp]
			}

			conditions.push(condition)
		}

		let chanceCondition = undefined
		if (chance !== undefined) {
			// TODO: make this work for diamonds eventually?
			const chanceValues = getNumbersFromDragonValues(chance.values).map(v => 2 ** (9-v)).map(v => v === 512? 0 : v)
			if (chanceValues.length === 1) {
				const chanceValue = chanceValues[0]
				//if (chanceValue === 1) chance = undefined
				chanceCondition = () => oneIn(chanceValue)
			} else {
				chanceCondition = () => oneIn(chanceValues[Random.Uint8 % chanceValues.length])
			}
		}

		const conditionFunction = (origin) => {

			if (chance !== undefined && !chanceCondition()) return [undefined, undefined]

			const neighbours = []
			const stamps = {}
			for (const stamp of stampNames) {
				stamps[stamp] = []
			}

			for (const condition of conditions) {
				const [neighbour, stamp] = condition(origin)
				if (neighbour === undefined) return [undefined, undefined]
				if (stamp !== undefined) {
					stamps[stamp].push(neighbour.colour)
				}
				neighbours.push(neighbour)
			}


			return [neighbours, stamps]
		}

		return conditionFunction
	}

	// TODO: also support Merging (with some funky backend syntax if needed)
	// TODO: also support Splitting (with some funky backend syntax if needed)
	// this funky syntax could include dummy cells on the right
	const makeResultFunction = (diagram, stampNames) => {

		const results = []
		for (const cell of diagram.right) {
			const result = cell.instruction(cell)
			results.push(result)
		}

		const refillAllStampRemainers = (remainers, stamps, stampNames) => {
			for (const stampName of stampNames) {
				refillStampRemainer(remainers, stamps, stampName)
			}
		}

		const refillStampRemainer = (remainers, stamps, stampName) => {
			remainers[stampName] = [...stamps[stampName]]
		}

		return (neighbours, redraw, stamps) => {

			let drawn = 0
			let neighbourId = 0
			let skip = 0
			const bonusTargets = []

			const stampRemainers = {}
			refillAllStampRemainers(stampRemainers, stamps, stampNames)

			for (const instruction of results) {
				const target = bonusTargets.length > 0? bonusTargets.pop() : neighbours[neighbourId]

				const result = instruction(target, redraw, neighbours, neighbourId, stampRemainers)

				if (result.stampNameTakenFrom !== undefined) {
					if (stampRemainers[result.stampNameTakenFrom].length === 0) {
						refillStampRemainer(stampRemainers, stamps, result.stampNameTakenFrom)
					}
				}

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
	DRAGON_INSTRUCTION = {}
	DRAGON_INSTRUCTION.nothing = (cell) => () => {
		return {drawn: 0}
	}
	DRAGON_INSTRUCTION.nothing.type = "NOTHING"

	DRAGON_INSTRUCTION.recolour = (cell) => {

		fillEmptyChannels(cell.content)

		const splashes = getSplashesArrayFromArray(cell.content)
		const isDynamic = isDragonArrayDynamic(cell.content)

		const instruction = (target, redraw, neighbours, neighbourId, stamps) => {

			let colour = undefined
			let source = target.colour
			let stampNameTakenFrom = undefined

			if (cell.content.stamp === undefined) {
				colour = splashes[Random.Uint32 % splashes.length]
			} else {
				const stampChoices = stamps[cell.content.stamp]
				if (stampChoices.length === 0) {
					colour = splashes[Random.Uint32 % splashes.length]
				}
				else {
					const stampId = Random.Uint32 % stampChoices.length
					source = stampChoices[stampId]
					colour = source
					stampChoices.splice(stampId, 1)
					stampNameTakenFrom = cell.content.stamp
				}
			}

			if (isDynamic) {

				const parts = getRGB(colour)

				for (let i = 0; i < cell.content.channels.length; i++) {
					const channel = cell.content.channels[i]
					if (channel.variable === undefined) continue
					let results = VARIABLE_EVALUATOR[channel.variable](channel, {source})
					if (channel.add !== undefined) {
						results = addChannelToResults(results, channel.add, {source, multiplier: 1})
					}
					if (channel.subtract !== undefined) {
						results = addChannelToResults(results, channel.subtract, {source, multiplier: -1})
					}
					const choices = results.map((v, i) => v === true? i : false).filter(v => v !== false)
					const newPart = choices[Random.Uint8 % choices.length]
					colour -= parts[i]
					const m = 10 ** (2-i)
					colour += newPart * m
				}
			}

			let drawn = 0
			if (redraw) drawn += queueCellDraw(target, colour, true)
			else target.colour = colour

			return {drawn, stampNameTakenFrom}
		}

		return instruction
	}
	DRAGON_INSTRUCTION.recolour.type = "RECOLOUR"

	const addChannelToResults = (augendResults, addend, {source, multiplier = 1}) => {
		let addendResults = addend.values
		if (addend.variable !== undefined) {
			addendResults = VARIABLE_EVALUATOR[addend.variable](addend, {source})
		}

		const addendChoices = addendResults.map((v, i) => v === true? i : false).filter(v => v !== false)
		const augendChoices = augendResults.map((v, i) => v === true? i : false).filter(v => v !== false)
		
		const choices = new Set()
		for (const augendChoice of augendChoices) {
			for (const addendChoice of addendChoices) {
				const choice = clamp(augendChoice + addendChoice*multiplier, 0, 9)
				choices.add(choice)
			}
		}

		let results = [false, false, false, false, false, false, false, false, false, false]
		for (const choice of choices) {
			results[choice] = true
		}

		if (addend.add !== undefined) {
			results = addChannelToResults(results, addend.add, {source, multiplier: 1})
		}

		if (addend.subtract !== undefined) {
			results = addChannelToResults(results, addend.add, {source, multiplier: -1})
		}

		return results
		
	}

	// A SPLIT REQUIRES THE CORRECT NUMBER OF RECOLOUR COMMANDS AFTER IT
	// IF YOU DON'T, IT WILL GO WRONG
	DRAGON_INSTRUCTION.split = (cell) => {

		//const splashes = getSplashesArrayFromArray(cell.content)

		const instruction = (target, redraw, neighbours, neighbourId, stamps) => {
			
			const children = splitCell(target, cell.splitX, cell.splitY)
			//const [head, ...tail] = children

			/*const colour = splashes[Random.Uint32 % splashes.length]
			let drawn = 0
			if (redraw) drawn += setCellColour(head, colour, true)
			else head.colour = colour*/

			return {drawn: 0, bonusTargets: children.reverse()}

		}
		return instruction

	}
	DRAGON_INSTRUCTION.split.type = "SPLIT"

	DRAGON_INSTRUCTION.merge = (cell) => {

		//const splashes = getSplashesArrayFromArray(cell.content)
		
		const childCount = Math.abs(cell.splitX) * Math.abs(cell.splitY)

		const instruction = (target, redraw, neighbours, neighbourId, stamps) => {

			const children = neighbours.slice(neighbourId, neighbourId+childCount)
			const merged = mergeCells(children)

			/*const colour = splashes[Random.Uint32 % splashes.length]
			let drawn = 0
			if (redraw) drawn += setCellColour(merged, colour)
			else merged.colour = colour*/

			return {drawn: 0, skip: childCount-1, bonusTargets: [merged]}

		}

		return instruction

	}
	DRAGON_INSTRUCTION.merge.type = "MERGE"

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
	debugRegistry = (registry, {transforms = true, redundants = true} = {}) => {
		const {redundantRules, transformedRules} = registry
		print("")
		print("=================================================================")
		if (transforms) {
			print("")
			print("TRANSFORMED RULES")
			for (const rule of transformedRules) {
				debugRule(rule)
			}
		}
		if (redundants) {
			print("")
			print("REDUNDANT RULES")
			for (const rule of redundantRules) {
				debugRule(rule)
			}
		}
	}

	debugRule = (rule) => {
		for (const step of rule.steps) {
			print("")
			print("=== LEFT ===")
			for (const cell of step.left) {
				debugDiagramCell(cell, {read: true})
			}
			print("=== RIGHT ===")
			for (const cell of step.right) {
				debugDiagramCell(cell)
			}
		}
	}

	debugDiagramCell = (cell, {read = false} = {}) => {
		if (read) {
			print("CHECK", "at", cell.x, cell.y, "with size", cell.width, cell.height, "for", getSplashesArrayFromArray(cell.content))
		}
		else {
			if (cell.instruction.type === "NOTHING") {
				print(cell.instruction.type, "at", cell.x, cell.y, "with size", cell.width, cell.height)
			}
			else if (cell.instruction.type === "RECOLOUR") {
				print(cell.instruction.type, "at", cell.x, cell.y, "with size", cell.width, cell.height, "to", getSplashesArrayFromArray(cell.content))
			} else {
				print(cell.instruction.type, cell.splitX, cell.splitY, "at", cell.x, cell.y, "with size", cell.width, cell.height)
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
	
	const WATER_DARK_FALL = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: GREY}),
			makeDiagramCell({x: 0, y: 1, width: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: BLACK}),
			makeDiagramCell({x: 0, y: 1, width: 1, content: GREY}),
		],
	})
	
	const WATER_DARK_SLIP = makeDiagram({
		left: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: GREY}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: BLACK}),
		],
		right: [
			makeDiagramCell({x: 0, y: 0, width: 1, content: BLACK}),
			makeDiagramCell({x: 1, y: 0, width: 1, content: GREY}),
		],
	})
	
	//registerRule(makeRule({steps: [ROCK_FALL_DIAGRAM], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	/*registerRule(makeRule({steps: [SAND_FALL_DIAGRAM], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	registerRule(makeRule({steps: [SAND_SLIDE_DIAGRAM], transformations: DRAGON_TRANSFORMATIONS.X}))

	registerRule(makeRule({steps: [WATER_DARK_FALL], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	registerRule(makeRule({steps: [WATER_DARK_SLIP], transformations: DRAGON_TRANSFORMATIONS.X}))*/

	//registerRule(makeRule({steps: [WATER_RIGHT_SPAWN_DIAGRAM], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_FALL], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_SLIP], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_SLIDE, WATER_RIGHT_FLIP], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_UNSLIP], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_UNSLIPP], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	//registerRule(makeRule({steps: [WATER_RIGHT_UNSLIPC], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	//registerRule(makeRule({steps: [], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_FALL_CYAN], transformations: DRAGON_TRANSFORMATIONS.NONE}))
	//registerRule(makeRule({steps: [WATER_RIGHT_SLIDE_DIAGRAM, WATER_RIGHT_SPIN], transformations: DRAGON_TRANSFORMATIONS.X}))

	//registerRule(makeRule({steps: [], transformations: DRAGON_TRANSFORMATIONS.X}))
	//registerRule(makeRule({steps: [WATER_RIGHT_SPIN], transformations: DRAGON_TRANSFORMATIONS.X}))

	/*

registerRule(
	makeRule({
		transformations: DRAGON_TRANSFORMATIONS.R,
		steps: [
			makeDiagram({
				left: [
					makeDiagramCell({x: 0, y: 0, content: makeArrayFromSplash(999)}),
					makeDiagramCell({x: 1, y: 0, content: makeArrayFromSplash(000)}),
				],
				right: [
					makeDiagramCell({x: 0, y: 0, content: makeArrayFromSplash(000)}),
					makeDiagramCell({x: 1, y: 0, content: makeArrayFromSplash(999)}),
				],
			})
		],
	}),
)

registerRule(
	makeRule({
		transformations: DRAGON_TRANSFORMATIONS.X,
		steps: [
			makeDiagram({
				left: [
					makeDiagramCell({x: 0, y: 0, content: makeArrayFromSplash(999)}),
				],
				right: [
					makeDiagramCell({x: 0, y: 0, width: 0.5, splitX: 2, splitY: 1, content: makeArrayFromSplash(Colour.Blue.splash), instruction: DRAGON_INSTRUCTION.split}),
					makeDiagramCell({x: 0.5, y: 0, width: 0.5, content: makeArrayFromSplash(Colour.Red.splash), instruction: DRAGON_INSTRUCTION.recolour}),
				],
			})
		],
	}),
)

	*/

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
	
	/*state.brush.colour = WATER_RIGHT
	state.brush.colour = Colour.Purple.splash
	state.brush.colour = Colour.Blue.splash
	state.brush.colour = Colour.Yellow.splash*/

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
			previous: {x: 0, y: 0},
		},
	}
	const hand = state.colourTode.hand

	//====================//
	// COLOURTODE - SETUP //
	//====================//
	const colourTodeCanvas = document.createElement("canvas")
	const colourTodeContext = colourTodeCanvas.getContext("2d")
	
	//colourTodeCanvas.style["image-rendering"] = "pixelated"
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

		if (Mouse.position !== undefined && Mouse.position[0] !== undefined && hand.previous.x !== undefined) {
			const [x, y] = Mouse.position.map(n => n / CT_SCALE)
			const dx = x - hand.previous.x
			const dy = y - hand.previous.y
			const velocity = {x: dx, y: dy}
			hand.velocityHistory.push(velocity)
			const sum = hand.velocityHistory.reduce((a, b) => ({x: a.x+b.x, y: a.y+b.y}), {x:0, y:0})
			const average = {x: sum.x / hand.velocityHistory.length, y: sum.y / hand.velocityHistory.length}
			hand.velocity.x = average.x
			hand.velocity.y = average.y
			hand.previous.x = x
			hand.previous.y = y
		}
	}
	
	const COLOURTODE_FRICTION = 0.9
	const colourTodeUpdate = () => {
		for (const atom of state.colourTode.atoms) {
			updateAtom(atom)
		}
	}

	const updateAtom = (atom, checkOffscreen = true) => {

		for (const child of atom.children) {
			updateAtom(child, false)
		}

		// HIGHLIGHT
		if (atom.highlighter) {
			updateAtomHighlight(atom)
		}

		atom.update(atom)

		// MOVEMENT
		if (hand.content === atom) return
		if (atom.dx === 0 && atom.dy === 0) return

		atom.x += atom.dx
		atom.y += atom.dy

		atom.x = clamp(atom.x, atom.minX, atom.maxX)
		atom.y = clamp(atom.y, atom.minY, atom.maxY)

		atom.dx *= COLOURTODE_FRICTION
		atom.dy *= COLOURTODE_FRICTION

		if (checkOffscreen && isAtomOffscreen(atom)) {
			deleteAtom(atom)
			return
		}

		const [mx, my] = Mouse.position.map(n => n / CT_SCALE)
		if (hand.state.atommove) hand.state.atommove(atom, mx, my)
	}

	const updateAtomHighlight = (atom) => {
		// Remove the previous highlight
		atom.highlightedAtom = undefined
		if (atom.highlight !== undefined) {
			deleteChild(atom, atom.highlight)
			atom.highlight = undefined
		}

		// Only highlight if I'm being dragged
		if (hand.content !== atom) return
		if (hand.state !== HAND.DRAGGING) return

		const highlightedAtom = atom.hover(atom)

		// Create the highlight
		if (highlightedAtom === undefined) return
		const highlight = createChild(atom, HIGHLIGHT, {bottom: true})
		highlight.hasBorder = true
		highlight.colour = Colour.Grey
		const {x, y} = getAtomPosition(highlightedAtom)
		highlight.x = x
		highlight.y = y
		highlight.width = highlightedAtom.width
		highlight.height = highlightedAtom.height

		atom.highlight = highlight
		atom.highlightedAtom = highlightedAtom
	}

	const colourTodeDraw = () => {
		colourTodeContext.clearRect(0, 0, colourTodeCanvas.width, colourTodeCanvas.height)
		/*if (!NO_FOOLS_MODE) {
			colourTodeContext.filter = "grayscale(100%)"
		}*/
		colourTodeContext.scale(CT_SCALE, CT_SCALE)
		for (const atom of state.colourTode.atoms) {
			drawAtom(atom)
		}
		colourTodeContext.scale(1/CT_SCALE, 1/CT_SCALE)
	}

	requestAnimationFrame(colourTodeTick)

	//===================//
	// COLOURTODE - HAND //
	//===================//
	const DRAG_PITY = 15
	const DRAG_PITY_TIME = 100
	const DRAG_UNPITY_SPEED = 10

	const HAND = {}
	HAND_RELEASE = 0.5
	HAND.FREE = {
		cursor: "auto",

		mousemove: (e) => {
			const x = e.clientX / CT_SCALE
			const y = e.clientY / CT_SCALE
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				if (atom.grabbable) {
					if (!Mouse.Left) {
						if (atom.cursor !== undefined) changeHandState(HAND.HOVER, atom.cursor(atom, HAND.HOVER))
						else if (atom.dragOnly) changeHandState(HAND.HOVER, "move")
						else changeHandState(HAND.HOVER)
					}
					else {
						if (atom.grabbable && atom.draggable) {
							grabAtom(atom, x, y)
							hand.pityStartX = e.clientX
							hand.pityStartY = e.clientY
							hand.pityStartT = Date.now()
							changeHandState(HAND.TOUCHING)
							//hand.content = hand.content.drag(hand.content, x, y)
							HAND.TOUCHING.mousemove(e)
						}
					}
				}
				return
			}

			const [mx, my] = Mouse.position

			if (mx < state.view.left || mx > state.view.right || my < state.view.top || my > state.view.bottom) {
				return
			}
			if (Mouse.Left) changeHandState(HAND.BRUSHING)
			else if (Mouse.Middle) changeHandState(HAND.PENCILLING)
			else changeHandState(HAND.BRUSH)
		},

		mousedown: (e) => {
			if (!state.worldBuilt) return
			hand.voidingStart = [e.clientX, e.clientY]
			changeHandState(HAND.VOIDING)
		},

		atommove: (atom, mx, my) => {
			if (!atom.grabbable) return
			if (!isAtomOverlapping(atom, mx, my)) return
			if (Mouse.Left) {
				grabAtom(atom, mx, my)
				changeHandState(HAND.DRAGGING)
				hand.content = hand.content.drag(hand.content, mx, my)
				return
			}
			if (atom.cursor !== undefined) changeHandState(HAND.HOVER, atom.cursor(atom, HAND.HOVER))
			else if (atom.dragOnly) changeHandState(HAND.HOVER, "move")
			else changeHandState(HAND.HOVER)
		},
		camerapan: () => {
			const [x, y] = Mouse.position
			if (x >= state.view.left && x <= state.view.right && y >= state.view.top && y <= state.view.bottom) {
				changeHandState(HAND.BRUSH)
				return
			}
		},
	}

	let voidingType = true
	HAND.VOIDING = {
		cursor: "auto",
		mousemove: (e) => {
			const start = hand.voidingStart
			const [sx, sy] = start
			const displacement = [e.clientX - sx, e.clientY - sy]
			const distance = Math.hypot(...displacement)
			if (distance > 10) {
				changeHandState(HAND.FREE)
				HAND.FREE.mousemove(e)
			}
		},
		mouseup: (e) => {
			const oldWorldSize = WORLD_SIZE
			setWorldSize(0)
			if (voidingType) {
				brush(0.5, 0.5)
			} else {
				const oldBrushColour = state.brush.colour
				state.brush.colour = 666
				brush(0.5, 0.5)
				state.brush.colour = oldBrushColour
				state.worldBuilt = false
			}
			voidingType = !voidingType
			setWorldSize(oldWorldSize)
			changeHandState(HAND.FREE)
		},
	}

	HAND.BRUSH = {
		cursor: "crosshair",
		mousemove: (e) => {
			const x = e.clientX / CT_SCALE
			const y = e.clientY / CT_SCALE
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				if (atom.grabbable) {
					if (atom.cursor !== undefined) changeHandState(HAND.HOVER, atom.cursor(atom, HAND.HOVER))
					else if (atom.dragOnly) changeHandState(HAND.HOVER, "move")
					else changeHandState(HAND.HOVER)
				}
				else changeHandState(HAND.FREE)
				return
			}
			const mx = e.clientX
			const my = e.clientY
			if (mx >= state.view.left && mx <= state.view.right && my >= state.view.top && my <= state.view.bottom) {
				return
			}
			changeHandState(HAND.FREE)
		},
		mousedown: (e) => {
			changeHandState(HAND.BRUSHING)
		},
		middlemousedown: (e) => {
			changeHandState(HAND.PENCILLING)
		},
		atommove: (atom, mx, my) => {
			if (!isAtomOverlapping(atom, mx, my)) return
			if (atom.grabbable) changeHandState(HAND.HOVER)
			else changeHandState(HAND.FREE)
		},
		camerapan: () => {
			const [x, y] = Mouse.position
			if (x >= state.view.left && x <= state.view.right && y >= state.view.top && y <= state.view.bottom) {
				return
			}
			changeHandState(HAND.FREE)
		},
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
		},
		camerapan: () => {
			const [mx, my] = Mouse.position
			if (mx >= state.view.left && mx <= state.view.right && my >= state.view.top && my <= state.view.bottom) {
				return
			}
			const [x, y] = Mouse.position.map(n => n / CT_SCALE)
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				if (atom.grabbable) {
					if (atom.cursor !== undefined) changeHandState(HAND.HOVER, atom.cursor(atom, HAND.HOVER))
					else if (atom.dragOnly) changeHandState(HAND.HOVER, "move")
					else changeHandState(HAND.HOVER)
				}
				else changeHandState(HAND.FREE)
				return
			}
			changeHandState(HAND.FREE)
		},
	}

	HAND.PENCILLING = {
		cursor: "crosshair",
		mousemove: HAND.BRUSHING.mousemove,
		middlemouseup: HAND.BRUSHING.mouseup,
		camerapan: HAND.BRUSHING.camerapan,
	}

	HAND.HOVER = {
		cursor: "pointer",
		
		mousedown: (e) => {

			const atom = getAtom(e.clientX / CT_SCALE, e.clientY / CT_SCALE)
			if (atom === undefined) return
			if (!atom.grabbable) return
			grabAtom(atom, e.clientX / CT_SCALE, e.clientY / CT_SCALE)
			
			if (atom.dragOnly) {
				
				hand.pityStartX = e.clientX
				hand.pityStartY = e.clientY
				hand.pityStartT = Date.now()
				hand.hasStartedDragging = false
				changeHandState(HAND.TOUCHING, "move")
			}
			else {
				hand.pityStartX = e.clientX
				hand.pityStartY = e.clientY
				hand.pityStartT = Date.now()
				hand.hasStartedDragging = false
				changeHandState(HAND.TOUCHING)
			}

		},

		mousemove: (e) => {
			const x = e.clientX / CT_SCALE
			const y = e.clientY / CT_SCALE
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				if (atom.grabbable) {
					if (atom.cursor !== undefined) changeHandState(HAND.HOVER, atom.cursor(atom, HAND.HOVER))
					else if (atom.dragOnly) changeHandState(HAND.HOVER, "move")
					else changeHandState(HAND.HOVER)
				}
				else changeHandState(HAND.FREE)
				return
			}
			const mx = e.clientX
			const my = e.clientY
			if (mx >= state.view.left && mx <= state.view.right && my >= state.view.top && my <= state.view.bottom) {
				changeHandState(HAND.BRUSH)
				return
			}
			changeHandState(HAND.FREE)
		},

		atommove: (atom, x, y) => {
			if (isAtomOverlapping(atom, x, y)) return
			const newAtom = getAtom(x, y)
			if (newAtom !== undefined) {
				return
			}
			const [mx, my] = Mouse.position
			if (mx >= state.view.left && mx <= state.view.right && my >= state.view.top && my <= state.view.bottom) {
				changeHandState(HAND.BRUSH)
				return
			}
			changeHandState(HAND.FREE)
		}
	}

	const dampen = (n, noReally) => {
		if (noReally) return n * 0.6
		return n
	}

	HAND.TOUCHING = {
		cursor: "pointer",
		mousemove: (e) => {
			if (e.movementX === 0 && e.movementY === 0) return

			const distanceFromPityStart = Math.hypot(e.clientX - hand.pityStartX, e.clientY - hand.pityStartY)
			const pity = DRAG_PITY

			const dx = e.clientX - hand.pityStartX
			const dy = e.clientY - hand.pityStartY
			
			if (!hand.content.dragLockX) hand.content.x = (hand.pityStartX + dampen(dx, hand.content.attached && !hand.content.noDampen)) / CT_SCALE + hand.offset.x
			if (!hand.content.dragLockY) hand.content.y = (hand.pityStartY + dampen(dy, hand.content.attached && !hand.content.noDampen)) / CT_SCALE + hand.offset.y

			hand.content.x = clamp(hand.content.x, hand.content.minX, hand.content.maxX)
			hand.content.y = clamp(hand.content.y, hand.content.minY, hand.content.maxY)

			if (distanceFromPityStart < pity) {
				return
			}

			const timeSincePityStart = Date.now() - hand.pityStartT
			if (timeSincePityStart < DRAG_PITY_TIME) {
				const handSpeed = Math.hypot(hand.velocity.x, hand.velocity.y)
				if (handSpeed <= DRAG_UNPITY_SPEED) return
			}

			if (!hand.content.dragLockX) hand.content.x = hand.pityStartX / CT_SCALE + hand.offset.x
			if (!hand.content.dragLockY) hand.content.y = hand.pityStartY / CT_SCALE + hand.offset.y

			hand.content.x = clamp(hand.content.x, hand.content.minX, hand.content.maxX)
			hand.content.y = clamp(hand.content.y, hand.content.minY, hand.content.maxY)

			const x = e.clientX / CT_SCALE
			const y = e.clientY / CT_SCALE
			if (hand.content.draggable) {				
				changeHandState(HAND.DRAGGING)

				const attached = hand.content.attached && !hand.content.dragOnly && !hand.content.noDampen

				hand.content = hand.content.drag(hand.content, x, y)
				
				if (!hand.content.dragLockX) hand.content.x = (hand.pityStartX + dampen(dx, attached)) / CT_SCALE + hand.offset.x
				if (!hand.content.dragLockY) hand.content.y = (hand.pityStartY + dampen(dy, attached)) / CT_SCALE + hand.offset.y

				hand.content.x = clamp(hand.content.x, hand.content.minX, hand.content.maxX)
				hand.content.y = clamp(hand.content.y, hand.content.minY, hand.content.maxY)

				/*hand.offset.x = hand.content.x - e.clientX / CT_SCALE
				hand.offset.y = hand.content.y - e.clientY / CT_SCALE*/

				HAND.DRAGGING.mousemove(e)
				return
			}

			const atom = getAtom(x, y)
			if (atom !== undefined) {
				if (atom.grabbable) {
					if (atom.cursor !== undefined) changeHandState(HAND.HOVER, atom.cursor(atom, HAND.HOVER))
					else if (atom.dragOnly) changeHandState(HAND.HOVER, "move")
					else changeHandState(HAND.HOVER)
				}
				else changeHandState(HAND.FREE)
				return
			}
			const mx = e.clientX
			const my = e.clientY
			if (mx >= state.view.left && mx <= state.view.right && my >= state.view.top && my <= state.view.bottom) {
				changeHandState(HAND.BRUSH)
				return
			}
			changeHandState(HAND.FREE)
		},
		mouseup: (e) => {
			hand.clickContent.click(hand.clickContent)
			hand.clickContent.dx = 0
			hand.clickContent.dy = 0
			hand.clickContent = undefined

			if (hand.content.attached) {
				hand.content.x = hand.pityStartX / CT_SCALE + hand.offset.x
				hand.content.y = hand.pityStartY / CT_SCALE + hand.offset.y
			}

			hand.content.dx = 0
			hand.content.dy = 0
			hand.content = undefined

			const x = e.clientX / CT_SCALE
			const y = e.clientY / CT_SCALE
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				if (atom.cursor !== undefined) changeHandState(HAND.HOVER, atom.cursor(atom, HAND.HOVER))
				else if (atom.dragOnly) changeHandState(HAND.HOVER, "move")
				else changeHandState(HAND.HOVER)
			}
			else changeHandState(HAND.FREE)
		}
	}

	HAND.DRAGGING = {
		cursor: "move",
		mousemove: (e) => {

			if (!hand.hasStartedDragging) {
				hand.hasStartedDragging = true
				hand.content = hand.content.drag(hand.content, e.clientX / CT_SCALE, e.clientY / CT_SCALE)
			}

			const oldX = hand.content.x
			const oldY = hand.content.y

			if (!hand.content.dragLockX) hand.content.x = e.clientX / CT_SCALE + hand.offset.x
			if (!hand.content.dragLockY) hand.content.y = e.clientY / CT_SCALE + hand.offset.y

			hand.content.x = clamp(hand.content.x, hand.content.minX, hand.content.maxX)
			hand.content.y = clamp(hand.content.y, hand.content.minY, hand.content.maxY)

			const dx = hand.content.x - oldX
			const dy = hand.content.y - oldY
			hand.content.move(hand.content, dx, dy)

			//hand.content.dx = hand.velocity.x
			//hand.content.dy = hand.velocity.y
		},
		mouseup: (e) => {
			hand.hasStartedDragging = true
			if (!hand.content.dragLockX) hand.content.dx = hand.velocity.x * HAND_RELEASE
			if (!hand.content.dragLockY) hand.content.dy = hand.velocity.y * HAND_RELEASE
			hand.content.drop(hand.content)
			if (hand.content.highlighter && hand.content.highlightedAtom !== undefined) {
				hand.content.place(hand.content, hand.content.highlightedAtom)
			}
			hand.content = undefined
			const x = e.clientX / CT_SCALE
			const y = e.clientY / CT_SCALE
			const atom = getAtom(x, y)
			if (atom !== undefined) {
				if (atom.grabbable) {
					if (atom.cursor !== undefined) changeHandState(HAND.HOVER, atom.cursor(atom, HAND.HOVER))
					else if (atom.dragOnly) changeHandState(HAND.HOVER, "move")
					else changeHandState(HAND.HOVER)
				}
				else changeHandState(HAND.FREE)
				return
			}
			else changeHandState(HAND.FREE)
			return
		}
	}

	const changeHandState = (state, cursor = state.cursor) => {
		if (hand.content !== undefined && hand.content.cursor !== undefined) {
			cursor = hand.content.cursor(hand.content, state)
		}
		colourTodeCanvas.style["cursor"] = cursor
		hand.state = state
	}

	on.mousemove(e => hand.state.mousemove? hand.state.mousemove(e) : undefined)
	on.mousedown(e => {

		if (e.button === 0) if (hand.state.mousedown) hand.state.mousedown(e)
		if (e.button === 1) if (hand.state.middlemousedown) hand.state.middlemousedown(e)
	})
	on.mouseup(e => {
		if (e.button === 0) if (hand.state.mouseup) hand.state.mouseup(e)
		if (e.button === 1) if (hand.state.middlemouseup) hand.state.middlemouseup(e)
		
	})

	hand.state = HAND.FREE

	//===================//
	// COLOURTODE - ATOM //
	//===================//
	const COLOURTODE_BASE_PARENT = {
		x: 0,
		y: 0,
		grab: (atom, x, y, child = atom) => child,
		touch: (atom, child = atom) => child,
	}
	const makeAtom = ({
			grabbable = true,
			draggable = true,
			click = () => {}, // Fires when you mouseup a click on the atom
			drag = (a) => a, // Fires when you start dragging the atom
			move = () => {}, // Fires when you start or continue dragging the atom //TODO: change this to be whenever the atom moves for any reason
			drop = () => {}, // Fires when you let go of the atom after a drag
			draw = () => {},
			update = () => {},
			offscreen = () => false,
			overlaps = () => false,
			grab = (a) => a, // Fires when you start a clock on the atom - returns atom that gets dragged
			touch = (a) => a, // Fires when you start a click on the atom - returns atom that handles the click
			highlighter = false, // If true, enables the hover and place events
			hover = () => {}, // Fires whenever you are dragging the atom - returns what atom should get highlighted (if any)
			place = () => {}, // Fires whenever you drop the atom onto a highlighted atom
			x = 0,
			y = 0,
			dx = 0,
			dy = 0,
			maxX = Infinity,
			minX = -Infinity,
			maxY = Infinity,
			minY = -Infinity,
			size = 40,
			colour = Colour.splash(999),
			children = [],
			parent = COLOURTODE_BASE_PARENT,
			width = size,
			height = size,
			construct = () => {},
			hasInner = true,
			...properties
		} = {}, ...args) => {
		const atom = {highlighter, place, hover, hasInner, move, drop, maxX, minX, maxY, minY, update, construct, draggable, width, height, touch, parent, children, draw, grabbable, click, drag, overlaps, offscreen, grab, x, y, dx, dy, size, colour, ...properties}
		atom.construct(atom, ...args)
		return atom
	}

	const getAtom = (x, y) => {
		for (let i = state.colourTode.atoms.length-1; i >= 0; i--) {
			const atom = state.colourTode.atoms[i]
			if (atom.justVisual) continue
			const result = isAtomOverlapping(atom, x, y)
			if (result !== undefined) return result
		}
	}

	const drawAtom = (atom) => {
		for (const child of atom.children) {
			if (child.behindParent) drawAtom(child)
		}
		if (atom.behindChildren) atom.draw(atom)
		for (const child of atom.children) {
			if (!child.behindParent) drawAtom(child)
		}
		if (!atom.behindChildren) atom.draw(atom)
	}

	const deleteAtom = (atom) => {
		const id = state.colourTode.atoms.indexOf(atom)
		state.colourTode.atoms.splice(id, 1)
	}

	const registerAtom = (atom) => {
		state.colourTode.atoms.push(atom)
	}

	// including children
	const isAtomOffscreen = (atom) => {
		for (const child of atom.children) {
			if (!isAtomOffscreen(child)) return false
		}
		return atom.offscreen(atom)
	}

	// including children
	const isAtomOverlapping = (atom, x, y) => {
		
		if (!atom.behindChildren && atom.overlaps(atom, x, y)) return atom
		
		for (let i = atom.children.length-1; i >= 0; i--) {
			const child = atom.children[i]
			if (child.behindParent) continue
			const result = isAtomOverlapping(child, x, y)
			if (result) return result
		}
		
		if (atom.behindChildren && atom.overlaps(atom, x, y)) return atom
		
		for (let i = atom.children.length-1; i >= 0; i--) {
			const child = atom.children[i]
			if (!child.behindParent) continue
			const result = isAtomOverlapping(child, x, y)
			if (result) return result
		}
	}

	const grabAtom = (atom, x, y) => {

		let previousTouched = atom
		let touched = atom.touch(atom)
		if (touched !== previousTouched) {
			const newTouched = touched.touch(touched, x, y, previousTouched)
			previousTouched = touched
			touched = newTouched
		}
		hand.clickContent = touched

		
		let previousGrabbed = atom
		let grabbed = atom.grab(atom, x, y)

		if (grabbed === undefined) return
		if (grabbed !== previousGrabbed) {
			const newGrabbed = grabbed.grab(grabbed, x, y, previousGrabbed)
			previousGrabbed = grabbed
			grabbed = newGrabbed
		}

		hand.content = grabbed
		hand.offset.x = grabbed.x - x
		hand.offset.y = grabbed.y - y
		grabbed.dx = 0
		grabbed.dy = 0

		if (atom.stayAtBack) bringAtomToBack(grabbed)
		else bringAtomToFront(grabbed)

		return grabbed
	}

	const bringAtomToFront = (grabbed) => {
		// If atom isn't a child, bring it to the top level
		if (grabbed.parent === COLOURTODE_BASE_PARENT) {
			deleteAtom(grabbed)
			registerAtom(grabbed)
		}
		else {
			const childId = grabbed.parent.children.indexOf(grabbed)
			grabbed.parent.children.splice(childId, 1)
			grabbed.parent.children.push(grabbed)
			if (grabbed.parent.stayAtBack) bringAtomToBack(grabbed.parent)
			else bringAtomToFront(grabbed.parent)
		}
	}

	const bringAtomToBack = (grabbed) => {
		if (grabbed.parent === COLOURTODE_BASE_PARENT) {
			const id = state.colourTode.atoms.indexOf(grabbed)
			state.colourTode.atoms.splice(id, 1)
			state.colourTode.atoms.unshift(grabbed)
		}
		else {
			const childId = grabbed.parent.children.indexOf(grabbed)
			grabbed.parent.children.splice(childId, 1)
			grabbed.parent.children.unshift(grabbed)
			if (grabbed.parent.stayAtBack) bringAtomToBack(grabbed.parent)
			else bringAtomToFront(grabbed.parent)
		}
	}

	getAtomPosition = (atom) => {
		const {x, y} = atom
		if (atom.parent === undefined) return {x, y}
		if (atom.hasAbsolutePosition) return {x, y}
		const {x: px, y: py} = getAtomPosition(atom.parent)
		return {x: x+px, y: y+py}
	}

	//=======================//
	// COLOURTODE - CHILDREN //
	//=======================//
	const createChild = (parent, element, {bottom = false} = {}) => {
		const child = makeAtom(element)
		if (!bottom) parent.children.push(child)
		else parent.children.unshift(child)
		child.parent = parent
		return child
	}
	
	const deleteChild = (parent, child, {quiet = false} = {}) => {
		const id = parent.children.indexOf(child)
		if (id === -1) {
			if (quiet) return
			else throw new Error(`Can't delete child of atom because I can't find it!`)
		}
		parent.children.splice(id, 1)
		child.parent = COLOURTODE_BASE_PARENT
	}
	
	const giveChild = (parent, atom) => {
		if (atom === undefined) {
			throw new Error(`Can't give child because child is undefined`)
		}
		if (parent === undefined) {
			throw new Error(`Can't give child because parent is undefined`)
		}
		deleteAtom(atom)
		if (atom.stayAtBack || atom.behindOtherChildren) parent.children.unshift(atom)
		else parent.children.push(atom)
		atom.parent = parent
	}

	const freeChild = (parent, child) => {
		if (hand.content === child) {
			const {x, y} = getAtomPosition(parent)
			hand.offset.x += x
			hand.offset.y += y
		}
		deleteChild(parent, child)
		registerAtom(child)
	}

	//======================//
	// COLOURTODE - ELEMENT //
	//======================//
	const COLOUR_CYCLE_SPEED = 5
	const COLOUR_CYCLE_LENGTH = 30
	const BORDER_THICKNESS = 3

	const getColourCycleLength = (atom) => {
		let length = Math.max(COLOUR_CYCLE_LENGTH / atom.colours.length, COLOUR_CYCLE_SPEED)
		/*if (atom.joins !== undefined && atom.joins.length > 0) {
			length *= 3
		}*/
		//if (atom.joins !== undefined && atom.joins.length > 0 && atom.joinExpanded !== false) return Infinity
		return length
	}

	// prepare border colours
	borderColours = PREBUILT_BORDER_COLOURS
	/*for (let i = 0; i < 1000; i++) {
		const colour = Colour.splash(i)
		let borderColour = undefined
		//let borderColour = Colour.add(colour, {lightness: -20})
		const darkness = 70 - colour.lightness
		borderColour = Colour.add(colour, {lightness: -20})
		borderColours.push(borderColour)
	}*/

	const toolBorderColours = borderColours.clone
	toolBorderColours[999] = Colour.splash(999)

	/*const toolBorderColours = []
	
	for (let i = 0; i < 1000; i++) {
		const colour = Colour.splash(i)
		let borderColour = Colour.add(colour, {lightness: -20})
		if (colour.lightness <= 35) {
			borderColour = Colour.add(colour, {lightness: 15})
		}
		toolBorderColours.push(borderColour)
	}
	toolBorderColours[000] = Colour.Grey*/

	const COLOURTODE_RECTANGLE = {
		draw: (atom) => {
			let {x, y} = getAtomPosition(atom)

			let X = Math.round(x)
			let Y = Math.round(y)
			let W = Math.round(atom.width)
			let H = Math.round(atom.height)
			let R = Math.round(atom.width/2)

			if (atom.hasBorder) {

				if (atom.hasInner) {

					let border = BORDER_THICKNESS
					if (atom.borderColour === undefined) {
						colourTodeContext.fillStyle = Colour.splash(atom.colour.splash)
						if (atom.isTool) {
							colourTodeContext.fillStyle = Colour.splash(atom.colour.splash)
							border *= 1.5
						} else if (atom.width === atom.height) {
							border *= 1.5
						}
					}
					else {
						colourTodeContext.fillStyle = atom.borderColour
					}

					colourTodeContext.beginPath()
					colourTodeContext.rect(X, Y, W, H)
					if (atom.stamp !== undefined) {
						colourTodeContext.arc(X+R, Y+R, Math.round((PADDLE_HANDLE.size - OPTION_MARGIN/2)/2), 0, 2*Math.PI)
					}


					if (atom.isGradient) {
						colourTodeContext.putImageData(atom.gradient, X * CT_SCALE, Y * CT_SCALE)
					} else {

						colourTodeContext.fill("evenodd")

						colourTodeContext.beginPath()
						colourTodeContext.fillStyle = atom.colour
						colourTodeContext.rect(X+border, Y+border, W-border*2, H-border*2)
						if (atom.stamp !== undefined) {
							colourTodeContext.arc(X+R, Y+R, Math.round((PADDLE_HANDLE.size - OPTION_MARGIN/2)/2)+border, 0, 2*Math.PI)
						}
						colourTodeContext.fill("evenodd")
					}
				}

				else {
					if (atom.borderColour === undefined) {
						colourTodeContext.strokeStyle = borderColours[atom.colour.splash]
					}
					else {
						colourTodeContext.strokeStyle = atom.borderColour
					}

					X = Math.round(x + 0.5) - 0.5
					Y = Math.round(y + 0.5) - 0.5

					colourTodeContext.lineWidth = BORDER_THICKNESS
					colourTodeContext.strokeRect(X, Y, W, H)
				}
			}

			else {
				colourTodeContext.fillStyle = atom.colour
				colourTodeContext.fillRect(X, Y, W, H)
			}

		},
		offscreen: (atom) => {
			const {x, y} = getAtomPosition(atom)
			const left = x
			const right = x + atom.width
			const top = y
			const bottom = y + atom.height
			if (right < 0) return true
			if (bottom < 0) return true
			if (left > canvas.width) return true
			if (top > canvas.height) return true
			return false
		},
		overlaps: (atom, mx, my) => {
			const {x, y} = getAtomPosition(atom)
			let border = BORDER_THICKNESS
			if (atom.isTool || atom.isSquare || atom.isTallRectangle) {
				border *= 1.5
			}
			const left = x
			const right = x + atom.width
			const top = y
			const bottom = y + atom.height

			if (mx < left) return false
			if (my < top) return false
			if (mx > right) return false
			if (my > bottom) return false
			
			return true
		},
	}

	const isCellAtomSpotFilled = (paddle, [sx, sy]) => {
		for (const cellAtom of paddle.cellAtoms) {
			const {x, y} = getAtomPosition(cellAtom)
			if (x === sx && y === sy) return true
		}
		return false
	}

	const setBrushColour = (value) => {
		if (typeof value === "number") {
			state.brush.colour = value
			squareTool.toolbarNeedsColourUpdate = true
		} else {
			const diagramCell = makeDiagramCell({content: value})
			state.brush.colour = makeDiagram({left: [diagramCell]})
			squareTool.toolbarNeedsColourUpdate = true
		}
	}

	const COLOURTODE_SQUARE = {
		//behindChildren: true,
		isSquare: true,
		hasBorder: true,
		draw: (atom) => {
			if (atom.value.isDiagram) return
			else COLOURTODE_RECTANGLE.draw(atom)
		},
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		touch: (atom) => {
			const diagramCell = makeDiagramCell({content: atom.value})
			state.brush.colour = makeDiagram({left: [diagramCell]})
			return atom
		},
		click: (atom) => {

			if (atom.joins.length > 0) {
				if (atom.parent === COLOURTODE_BASE_PARENT || !atom.parent.pinhole.locked) {
					if (atom.joinExpanded) {
						atom.joinUnepxand(atom)
					} else {
						atom.joinExpand(atom)
					}
				}
			}

			else if (atom.value.isDiagram) {

			}

			else if (!atom.expanded) {

				if (atom.parent === COLOURTODE_BASE_PARENT || !atom.parent.isPaddle) {
					atom.expand(atom)
				}

			}
			else {
				atom.unexpand(atom)
			}

			setBrushColour(atom.value)
		},

		expand: (atom) => {
			atom.expanded = true
			atom.createPicker(atom)
		},

		unexpand: (atom) => {
			atom.expanded = false
			atom.redExpanded = atom.red && atom.red.expanded
			atom.greenExpanded = atom.green && atom.green.expanded
			atom.blueExpanded = atom.blue && atom.blue.expanded
			atom.deletePicker(atom)
		},

		createPicker: (atom) => {
			const pickerHandle = createChild(atom, SYMMETRY_HANDLE)
			pickerHandle.width += OPTION_MARGIN
			atom.pickerHandle = pickerHandle
			atom.pickerHandle.behindParent = true
			
			const pickerPad = createChild(atom, COLOURTODE_PICKER_PAD)
			atom.pickerPad = pickerPad

			if (atom.value.channels[2] !== undefined) {
				if (atom.value.channels[2].variable === undefined) {
					const blue = createChild(atom, COLOURTODE_PICKER_CHANNEL)
					blue.channelSlot = "blue" //note: a colour doesn't necessarily have to be in its own channel slot
					blue.x += COLOURTODE_PICKER_PAD_MARGIN + 3 * (COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN)
					blue.value = atom.value.channels[2]
					blue.needsColoursUpdate = true
					//blue.grab = () => atom
					atom.blue = blue
					blue.deletedOptions = atom.deletedBlueOptions
					if (atom.blueExpanded) atom.blue.click(atom.blue)
					atom.blue.attached = true
				} else {
					let diamond = atom.variableAtoms[2]
					registerAtom(diamond)
					giveChild(atom, diamond)
					diamond.channelSlot = "blue"
					diamond.updateAppearance(diamond)
					diamond.x = (COLOURTODE_PICKER_PAD_MARGIN + COLOURTODE_SQUARE.size)*3 + (COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN)/2 - diamond.width/3
					diamond.y = atom.height/2 - diamond.height/2
					diamond.attached = true

					atom.blue = diamond
					//if (atom.redExpanded) diamond.expand(diamond)
				}
			}

			if (atom.value.channels[1] !== undefined) {
				if (atom.value.channels[1].variable === undefined) {
					const green = createChild(atom, COLOURTODE_PICKER_CHANNEL)
					green.channelSlot = "green" //note: a colour doesn't necessarily have to be in its own channel slot
					green.x += COLOURTODE_PICKER_PAD_MARGIN + 2 * (COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN)
					green.value = atom.value.channels[1]
					green.needsColoursUpdate = true
					//green.grab = () => atom
					atom.green = green
					green.deletedOptions = atom.deletedGreenOptions
					if (atom.greenExpanded) atom.green.click(atom.green)
					atom.green.attached = true
				} else {
					let diamond = atom.variableAtoms[1]
					registerAtom(diamond)
					giveChild(atom, diamond)
					diamond.channelSlot = "green"
					diamond.updateAppearance(diamond)
					diamond.x = (COLOURTODE_PICKER_PAD_MARGIN + COLOURTODE_SQUARE.size)*2 + (COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN)/2 - diamond.width/3
					diamond.y = atom.height/2 - diamond.height/2
					diamond.attached = true

					atom.green = diamond
					//if (atom.redExpanded) diamond.expand(diamond)
				}
			}

			if (atom.value.channels[0] !== undefined) {
				if (atom.value.channels[0].variable === undefined) {
					const red = createChild(atom, COLOURTODE_PICKER_CHANNEL)
					red.channelSlot = "red" //note: a colour doesn't necessarily have to be in its own channel slot
					red.x += COLOURTODE_PICKER_PAD_MARGIN + COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN
					red.value = atom.value.channels[0]
					red.needsColoursUpdate = true
					//red.grab = () => atom
					atom.red = red
					red.deletedOptions = atom.deletedRedOptions
					if (atom.redExpanded) atom.red.click(atom.red)
					atom.red.attached = true
				} else {
					let diamond = atom.variableAtoms[0]
					registerAtom(diamond)
					giveChild(atom, diamond)
					diamond.channelSlot = "red"
					diamond.updateAppearance(diamond)
					diamond.x = (COLOURTODE_PICKER_PAD_MARGIN + COLOURTODE_SQUARE.size) + (COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN)/2 - diamond.width/3
					diamond.y = atom.height/2 - diamond.height/2
					diamond.attached = true

					atom.red = diamond
					//if (atom.redExpanded) diamond.expand(diamond)
				}
			}
		},

		deletePicker: (atom) => {
			deleteChild(atom, atom.pickerPad)
			deleteChild(atom, atom.pickerHandle)
			if (atom.red) {
				atom.deletedRedOptions = atom.red.options
				deleteChild(atom, atom.red)
			}
			if (atom.green) {
				atom.deletedGreenOptions = atom.green.options
				deleteChild(atom, atom.green)
			}
			if (atom.blue) {
				atom.deletedBlueOptions = atom.blue.options
				deleteChild(atom, atom.blue)
			}
		},

		receiveNumber: (atom, number, channel = number.channel, {expanded, numberAtom} = {}) => {
			
			atom.redExpanded = atom.red && atom.red.expanded
			atom.greenExpanded = atom.green && atom.green.expanded
			atom.blueExpanded = atom.blue && atom.blue.expanded
			
			if (atom.variableAtoms === undefined) {
				atom.variableAtoms = [undefined, undefined, undefined]
			}

			if (number !== undefined && number.variable !== undefined) {
				atom.variableAtoms[channel] = numberAtom
			} else {
				atom.variableAtoms[channel] = undefined
			}

			if (expanded !== undefined) {
				const channelName = CHANNEL_NAMES[channel]
				atom[`${channelName}Expanded`] = expanded
			}

			atom.value.channels[channel] = number

			atom.deletePicker(atom)
			atom.createPicker(atom)
			atom.needsColoursUpdate = true
			atom.colourTicker = Infinity

			/*const diagramCell = makeDiagramCell({content: atom.value})
			state.brush.colour = makeDiagram({left: [diagramCell]})*/

			if (atom.parent !== COLOURTODE_BASE_PARENT) {
				const paddle = atom.parent
				updatePaddleRule(paddle)
			}

			const brushDiagramCell = makeDiagramCell({content: atom.value})
			state.brush.colour = makeDiagram({left: [brushDiagramCell]})

			squareTool.toolbarNeedsColourUpdate = true
			triangleTool.toolbarNeedsColourUpdate = true
			circleTool.toolbarNeedsColourUpdate = true
			wideRectangleTool.toolbarNeedsColourUpdate = true
			tallRectangleTool.toolbarNeedsColourUpdate = true

		},

		construct: (atom) => {
			atom.needsColoursUpdate = true
			/*const r = Random.Uint8 % 10
			const g = Random.Uint8 % 10
			const b = Random.Uint8 % 10*/
			/*const r = Random.Uint8 % 10
			const g = Random.Uint8 % 10
			const b = Random.Uint8 % 10*/
			//atom.value = makeArrayFromSplash(r*100 + g*10 + b)
			//atom.value = makeArrayFromSplash(555)
			//const splash = TODEPOND_COLOURS[Random.Uint8 % TODEPOND_COLOURS.length]
			if (typeof state.brush.colour === "number") {
				atom.value = makeArrayFromSplash(state.brush.colour)
			} else {
				atom.value = cloneDragonArray(state.brush.colour.left[0].content)
			}
			
			atom.colourId = 0
			atom.dcolourId = 1
			atom.colourTicker = Infinity
			atom.joins = []
			atom.joinColourIds = []
			atom.variableAtoms = []

			atom.gradient = new ImageData(atom.width * CT_SCALE, atom.height * CT_SCALE)

		},

		update: (atom) => {
			
			if (atom.value.isDiagram) {
				if (atom.multiAtoms === undefined || atom.multiAtoms.length === 0) {
					atom.multiAtoms = []
					const diagram = atom.value
					const [diagramWidth, diagramHeight] = getDiagramDimensions(diagram)
					const cellAtomWidth = atom.width / diagramWidth
					const cellAtomHeight = atom.height / diagramHeight
					for (const diagramCell of diagram.left) {
						const multiAtom = createChild(atom, COLOURTODE_SQUARE)
						multiAtom.x = diagramCell.x * cellAtomWidth
						multiAtom.y = diagramCell.y * cellAtomHeight
						multiAtom.width = diagramCell.width * cellAtomWidth
						multiAtom.height = diagramCell.height * cellAtomHeight
						multiAtom.value = diagramCell.content
						atom.multiAtoms.push(multiAtom)
					}
				}

			} else {

				if (atom.needsColoursUpdate) {

					let drawTarget = atom.value
					if (atom.joins.length > 0 && !atom.joinExpanded) {
						if (atom.joinDrawId >= 0) {
							drawTarget = atom.joins[atom.joinDrawId].value
						}
					}

					const valueClone = cloneDragonArray(drawTarget)
					if (atom.value === drawTarget) valueClone.joins = []
					atom.colours = getSplashesArrayFromArray(valueClone)

					// Create pixel values for gradient
					atom.isGradient = false
					if (true || atom.colours.length > 1) {
						atom.isGradient = true
						atom.gradient = getGradientImageFromColours({
							colours: atom.colours,
							width: atom.width * CT_SCALE,
							height: atom.height * CT_SCALE,
							gradient: atom.gradient,
							stamp: atom.value.stamp,
						})
						
					}
					atom.colourId = Random.Uint32 % atom.colours.length
					atom.needsColoursUpdate = false

				}
			}

			const {x, y} = getAtomPosition(atom)

			atom.highlightedAtom = undefined

			if (hand.content === atom && hand.state === HAND.DRAGGING) {

				const left = x
				const top = y
				const right = x + atom.width
				const bottom = y + atom.height

				if (atom.highlight !== undefined) {
					deleteChild(atom, atom.highlight)
					atom.highlight = undefined
				}
				
				if (atom.highlightedAtom === undefined) {
					const atoms = getAllBaseAtoms()
					for (let other of atoms) {
						if (other === atom) continue
						if (!other.isSquare) continue
						if (other.joins.length > 0 && other.joinExpanded) {
							other = other.pickerPad
						}
						
						const {x: ox, y: oy} = getAtomPosition(other)
						const oleft = ox
						const oright = ox + other.width
						const otop = oy
						const obottom = oy + other.height

						if (left > oright) continue
						if (right < oleft) continue
						if (bottom < otop) continue
						if (top > obottom) continue

						if (other.isPicker) {
							atom.highlightedAtom = other.parent
						} else {
							if (other.parent !== COLOURTODE_BASE_PARENT) continue
							atom.highlightedAtom = other
						}

						atom.highlight = createChild(atom, HIGHLIGHT, {bottom: true})
						atom.highlight.hasBorder = true
						atom.highlight.hasInner = false
						atom.highlight.width = other.width
						atom.highlight.height = other.height
						atom.highlight.x = ox
						atom.highlight.y = oy

						break

					}
				}

				if (atom.highlightedAtom === undefined) for (const paddle of paddles) {

					if (!paddle.expanded || paddle.pinhole.locked) continue

					const {x: px, y: py} = getAtomPosition(paddle)
					const pleft = px
					const pright = px + paddle.width
					const ptop = py
					const pbottom = py + paddle.height

					if (left > pright) continue
					if (right < pleft) continue
					if (top > pbottom) continue
					if (bottom < ptop) continue

					if (paddle.cellAtoms.length === 0) {

						atom.highlight = createChild(atom, HIGHLIGHT, {bottom: true})
						atom.highlight.hasBorder = true
						atom.highlight.colour = Colour.Grey
						atom.highlight.x = paddle.x
						atom.highlight.y = paddle.y
						atom.highlight.width = paddle.width
						atom.highlight.height = paddle.height

						atom.highlightedAtom = paddle

						break

					}

					else if (paddle.rightTriangle !== undefined && left > pleft + paddle.rightTriangle.x) {
						let winningDistance = Infinity
						let winningSlot = undefined
						for (const cellAtom of paddle.cellAtoms) {
							if (cellAtom.slotted !== undefined) continue
							const {x: cx, y: cy} = getAtomPosition(cellAtom.slot)
							
							const distance = Math.hypot(x - cx, y - cy)
							if (distance < winningDistance) {
								winningDistance = distance
								winningSlot = cellAtom.slot
							}

						}

						if (winningSlot === undefined) break

						const {x: cx, y: cy} = getAtomPosition(winningSlot)
						atom.highlight = createChild(atom, HIGHLIGHT, {bottom: true})
						atom.highlight.x = cx
						atom.highlight.y = cy
						atom.highlight.hasBorder = true
						atom.highlight.colour = Colour.Grey
						atom.highlightedAtom = winningSlot

						break
					}
					
					else {
						let winningDistance = Infinity
						let winningSide = undefined
						let winningCellAtom = undefined

						for (const cellAtom of paddle.cellAtoms) {
							const {x: cx, y: cy} = getAtomPosition(cellAtom)
							const cleft = cx
							const cright = cx + cellAtom.width
							const ctop = cy
							const cbottom = cy + cellAtom.height

							const spotLeft = [cleft - cellAtom.width, ctop]
							const spotAbove = [cleft, ctop - cellAtom.height]
							const spotRight = [cright, ctop]
							const spotBelow = [cleft, cbottom]

							const dspotLeft = Math.hypot(x - spotLeft[0], y - spotLeft[1])
							if (!isCellAtomSpotFilled(paddle, spotLeft) && dspotLeft < winningDistance) {
								winningDistance = dspotLeft
								winningCellAtom = cellAtom
								winningSide = "left"
							}

							const dspotAbove = Math.hypot(x - spotAbove[0], y - spotAbove[1])
							if (!isCellAtomSpotFilled(paddle, spotAbove) && dspotAbove < winningDistance) {
								winningDistance = dspotAbove
								winningCellAtom = cellAtom
								winningSide = "above"
							}

							const dspotRight = Math.hypot(x - spotRight[0], y - spotRight[1])
							if (!isCellAtomSpotFilled(paddle, spotRight) && dspotRight < winningDistance) {
								winningDistance = dspotRight
								winningCellAtom = cellAtom
								winningSide = "right"
							}

							const dspotBelow = Math.hypot(x - spotBelow[0], y - spotBelow[1])
							if (!isCellAtomSpotFilled(paddle, spotBelow) && dspotBelow < winningDistance) {
								winningDistance = dspotBelow
								winningCellAtom = cellAtom
								winningSide = "below"
							}
						}

						const {x: cx, y: cy} = getAtomPosition(winningCellAtom)

						atom.highlight = createChild(atom, HIGHLIGHT, {bottom: true})
						if (winningSide === "left" || winningSide === "right") {
							atom.highlight.width = HIGHLIGHT_THICKNESS
							atom.highlight.height = winningCellAtom.height
						}
						else if (winningSide === "above" || winningSide === "below") {
							atom.highlight.width = winningCellAtom.width
							atom.highlight.height = HIGHLIGHT_THICKNESS
						}

						if (winningSide === "left") {
							atom.highlight.x = cx - HIGHLIGHT_THICKNESS/2
							atom.highlight.y = cy
						}
						else if (winningSide === "right") {
							atom.highlight.x = cx - HIGHLIGHT_THICKNESS/2 + winningCellAtom.width
							atom.highlight.y = cy
						}
						else if (winningSide === "above") {
							atom.highlight.x = cx
							atom.highlight.y = cy - HIGHLIGHT_THICKNESS/2
						}
						else if (winningSide === "below") {
							atom.highlight.x = cx
							atom.highlight.y = cy - HIGHLIGHT_THICKNESS/2 + winningCellAtom.height
						}

						atom.highlightedAtom = winningCellAtom
						atom.highlightedSide = winningSide

						break

					}

				}


			}

			if (atom.highlightedAtom === undefined && atom.highlight !== undefined) {
				deleteChild(atom, atom.highlight)
				atom.highlight = undefined
			}

		},

		drop: (atom) => {
			if (atom.highlight !== undefined) {

				if (atom.highlightedAtom.isPaddle) {
					const paddle = atom.highlightedAtom
					atom.attached = true
					giveChild(paddle, atom)
					paddle.cellAtoms.push(atom)
					atom.x = PADDLE.width/2 - atom.width/2
					atom.y = PADDLE.height/2 - atom.height/2
					atom.dx = 0
					atom.dy = 0
					
					updatePaddleSize(paddle)
					if (atom.expanded) {
						atom.unexpand(atom)
					}

					if (paddle.rightTriangle !== undefined && atom.slotted !== undefined) {
						registerAtom(atom.slotted)
						giveChild(paddle, atom.slotted)
					}
				}
				else if (atom.highlightedAtom.isSlot) {
					const slot = atom.highlightedAtom
					const paddle = slot.parent
					atom.attached = true
					giveChild(paddle, atom)
					atom.x = slot.x
					atom.y = slot.y
					atom.dx = 0
					atom.dy = 0
					slot.cellAtom.slotted = atom
					atom.cellAtom = slot.cellAtom
					atom.slottee = true

					updatePaddleSize(slot.parent)
					if (atom.expanded) {
						atom.unexpand(atom)
					}
				}
				else if (atom.highlightedAtom.isSquare && atom.highlightedAtom.parent.isPaddle && !(atom.highlightedAtom.joins.length > 0 && atom.highlightedAtom.joinExpanded)) {

					const square = atom.highlightedAtom
					const paddle = square.parent
					atom.attached = true
					giveChild(paddle, atom)
					paddle.cellAtoms.push(atom)
					if (atom.expanded) {
						atom.unexpand(atom)
					}

					if (atom.highlightedSide === "left") {
						atom.x = square.x - atom.width
						atom.y = square.y
					} else if (atom.highlightedSide === "right") {
						atom.x = square.x + square.width
						atom.y = square.y
					} else if (atom.highlightedSide === "above") {
						atom.x = square.x
						atom.y = square.y - atom.height
					} else if (atom.highlightedSide === "below") {
						atom.x = square.x
						atom.y = square.y + square.height
					}

					if (paddle.rightTriangle !== undefined && atom.slotted !== undefined) {
						registerAtom(atom.slotted)
						giveChild(paddle, atom.slotted)
					}

					atom.dx = 0
					atom.dy = 0
					updatePaddleSize(paddle)

				}
				else {
					const joinee = atom.highlightedAtom
					const joiner = atom

					if (joinee.expanded) {
						joinee.unexpand(joinee)
					}

					if (joiner.expanded) {
						joiner.unexpand(joiner)
					}
					
					if (joinee.joinExpanded) {
						joinee.joinUnepxand(joinee)
					}

					joinee.joins.push(joiner)
					deleteAtom(joiner)
					joinee.isJoinee = true
					
					joinee.joinExpand(joinee)
					
					
					joinee.value.joins.push(joiner.value)
					joinee.needsColoursUpdate = true
					joinee.colourTicker = Infinity

					const diagramCell = makeDiagramCell({content: joinee.value})
					state.brush.colour = makeDiagram({left: [diagramCell]})
					
					if (atom.expanded) {
						atom.unexpand(atom)
					}
					
				}

			}
		},

		joinExpand: (atom) => {
			atom.joinExpanded = true
			
			const pickerPad = createChild(atom, COLOURTODE_PICKER_PAD)
			atom.pickerPad = pickerPad
			pickerPad.width = atom.width + OPTION_MARGIN*2
			pickerPad.x = -OPTION_MARGIN
			pickerPad.height = (atom.joins.length+1) * (atom.height + OPTION_MARGIN) + OPTION_MARGIN
			pickerPad.y = -OPTION_MARGIN
			pickerPad.dragOnly = false
			pickerPad.touch = (atom) => atom.parent

			for (let i = 0; i < atom.joins.length; i++) {
				const joiner = atom.joins[i]
				registerAtom(joiner)
				giveChild(atom, joiner)
				joiner.x = 0
				joiner.y = (i+1) * (atom.height + OPTION_MARGIN)
				joiner.dx = 0
				joiner.dy = 0
				joiner.touch = (atom) => atom.parent
				joiner.grab = (atom) => atom.parent
				
			}
			
			atom.needsColoursUpdate = true
			atom.colourTicker = Infinity

			if (atom.multiAtoms !== undefined) {
				for (const multiAtom of atom.multiAtoms) {
					bringAtomToFront(multiAtom)
				}
			}
			
		},

		joinUnepxand: (atom) => {
			atom.joinExpanded = false
			deleteChild(atom, atom.pickerPad)

			for (let i = 0; i < atom.joins.length; i++) {
				const joiner = atom.joins[i]
				deleteChild(atom, joiner)
			}
			
			atom.needsColoursUpdate = true
			atom.colourTicker = Infinity

		},

		drag: (atom) => {

			if (atom.attached) {

				const paddle = atom.parent
				if (paddle.pinhole.locked) {
					const {x, y} = getAtomPosition(atom)
					const clone = makeAtom(COLOURTODE_SQUARE)
					hand.offset.x -= atom.x - x
					hand.offset.y -= atom.y - y
					clone.x = x
					clone.y = y

					const dragonArray = cloneDragonArray(atom.value)
					clone.value = dragonArray

					if (clone.value.joins !== undefined) {
						for (const j of clone.value.joins) {
							const joinAtom = makeAtom(COLOURTODE_SQUARE)
							joinAtom.value = j
							clone.joins.push(joinAtom)
						}
					}
					clone.stamp = clone.value.stamp
					registerAtom(clone)

					/*if (atom.slotted !== undefined) {
						clone.slotted = makeAtom(COLOURTODE_SQUARE)
						const slottedDragonArray = cloneDragonArray(atom.slotted.value)
						clone.slotted.value = slottedDragonArray
						//registerAtom(clone)
					}*/

					if (clone.value.isDiagram) {
						clone.update(clone)
					}

					return clone
				}

				if (atom.slottee) {
					atom.attached = false
					atom.slottee = false
					freeChild(paddle, atom)
					atom.cellAtom.slot.colour = Colour.Black
					atom.cellAtom.slotted = undefined
					atom.cellAtom = undefined
					return atom
				}
				
				atom.attached = false
				freeChild(paddle, atom)

				const id = paddle.cellAtoms.indexOf(atom)
				paddle.cellAtoms.splice(id, 1)
				
				atom.slot = undefined
				if (paddle.rightTriangle !== undefined && atom.slotted !== undefined) {
					freeChild(paddle, atom.slotted)
					deleteAtom(atom.slotted)
				}
				//atom.slotted = undefined
				updatePaddleSize(paddle)

			}

			return atom
		},

		size: 40,
		expanded: false,
	}

	const getWarpedGradientPoints = (width, height) => {
		
		const maxWidth = 1.0
		const maxHeight = 1.0

		/*
		const max = Math.max(width, height)
		const maxWidth = max / width
		const maxHeight = max / height
		*/
		
		const midWidth = maxWidth/2
		const midHeight = maxHeight/2



		return [
			[maxWidth, 0.0], [maxWidth, midHeight], [maxWidth, maxHeight],
			[midWidth, 0.0], [midWidth, midHeight], [midWidth, maxHeight],
			[0.0, 0.0],      [0.0, midHeight],      [0.0, maxHeight],
		]
	}

	const getDistancesFromGradientPoints = (x, y, points) => {
		const distances = []
		for (const [px, py] of points) {
			const displacement = [px-x, py-y]
			const distance = Math.hypot(...displacement)
			distances.push(distance)
		}
		return distances
	}

	const getGradientPointScoresFromDistances = (distances) => {
		const scores = []
		for (const distance of distances) {
			//if (distance === min) scores.push(distance**2)
			//else scores.push(0.0)
			scores.push(distance**2)
		}
		return scores
	}

	const getGradientImageFromColours = ({colours, width, height, gradient = new ImageData(width, height), stamp}) => {
		
		const ogWidth = width
		const ogHeight = height
		;[width, height] = [width, height].map(dimension => Math.round(dimension))
		//const size = Math.max(width, height)
		//width = height = size
		const newLength = ogWidth * ogHeight * 4
		if (gradient.data.length !== newLength) {
			gradient = new ImageData(ogWidth, ogHeight)
		}
		let minRed = Infinity
		let maxRed = -Infinity
		let minGreen = Infinity
		let maxGreen = -Infinity
		let minBlue = Infinity
		let maxBlue = -Infinity

		for (const colour of colours) {
			const [r, g, b] = getRGB(colour)
			if (r < minRed) minRed = r
			if (r > maxRed) maxRed = r
			if (g < minGreen) minGreen = g
			if (g > maxGreen) maxGreen = g
			if (b < minBlue) minBlue = b
			if (b > maxBlue) maxBlue = b
		}

		const makeGradientColour = (red, green, blue) => {
			//return Colour.splash(maxRed + maxGreen + maxBlue)
			return Colour.splash((red === 1? maxRed : minRed) + (green === 1? maxGreen : minGreen) + (blue === 1? maxBlue : minBlue))
		}

		const gradientColours = [

			makeGradientColour(0, 0, 1),
			makeGradientColour(0, 0, 1),
			makeGradientColour(0, 0, 1),
			
			makeGradientColour(0, 1, 1),
			makeGradientColour(1, 0, 0),
			makeGradientColour(1, 0, 0),
			
			makeGradientColour(0, 1, 0),
			makeGradientColour(0, 1, 0),
			makeGradientColour(1, 0, 0),
			
			/*
			makeGradientColour(0, 1, 0),
			makeGradientColour(0, 1, 1),
			makeGradientColour(0, 0, 1),
			
			makeGradientColour(1, 1, 0),
			makeGradientColour(1, 1, 1),
			makeGradientColour(1, 0, 1),
			
			makeGradientColour(1, 0, 0),
			makeGradientColour(0, 0, 0),
			makeGradientColour(0, 0, 1),
			*/

		]

		const points = getWarpedGradientPoints(width, height)
		let i = 0
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {

				const distances = getDistancesFromGradientPoints(x / width, y / height, points)
				const scores = getGradientPointScoresFromDistances(distances)
				const sumValues = [0, 0, 0]
				const sumScore = scores.reduce((a, b) => a + b)
				for (let j = 0; j < 9; j++) {
					const score = scores[j]
					const colour = gradientColours[j]
					;[0, 1, 2].forEach(channel => sumValues[channel] += score * colour[channel])
				}
				const values = sumValues.map(value => value / sumScore)
				if (stamp === "circle" && x >= width/4 && x < width*3/4 && y >= height/4 && y < height*3/4) {
					/*
					gradient.data[i] = values[0] / 3*2
					gradient.data[i+1] = values[1] / 3*2
					gradient.data[i+2] = values[2] / 3*2
					*/
					gradient.data[i+3] = 0
				} else {
					gradient.data[i] = values[0]
					gradient.data[i+1] = values[1]
					gradient.data[i+2] = values[2]
					gradient.data[i+3] = 255
				}

				i += 4
				if (i >= gradient.data.length) break
			}
		}
		return gradient
	}

	const TRIANGLE_RIGHT = {
		size: COLOURTODE_SQUARE.size,
		width: COLOURTODE_SQUARE.size * Math.sqrt(3)/2, //the only reason width is set is for the menu spacing
		draw: (atom) => {

			const {x, y} = getAtomPosition(atom)

			let size = atom.size
			if (atom.isTool) size -= BORDER_THICKNESS*2.5

			const height = size
			const width = size * Math.sqrt(3)/2
			
			const left = x
			const right = left + width
			let top = y
			if (atom.isTool) top += BORDER_THICKNESS*1.25
			const bottom = top + height
			const middleY = top + height/2

			colourTodeContext.fillStyle = atom.colour
			const path = new Path2D()

			path.moveTo(left, top)
			path.lineTo(right, middleY)
			path.lineTo(left, bottom)
			path.closePath()
			colourTodeContext.fillStyle = atom.colour
			colourTodeContext.fill(path)
			if (atom.hasBorder) {
				colourTodeContext.lineWidth = BORDER_THICKNESS*1.5
				colourTodeContext.strokeStyle = atom.borderColour

				if (atom.isTool) {
					//colourTodeContext.lineWidth = BORDER_THICKNESS*1.0
					colourTodeContext.strokeStyle = toolBorderColours[atom.colour.splash]
				}
				colourTodeContext.stroke(path)
			}
		},
		overlaps: (atom, x, y) => {
			
			const {x: ax, y: ay} = getAtomPosition(atom)

			const height = atom.size
			const width = atom.size * Math.sqrt(3)/2
			
			const left = ax
			const right = left + width
			const top = ay
			const bottom = top + height

			if (x < left) return false
			if (y < top) return false
			if (x > right) return false
			if (y > bottom) return false

			return true
		},
		offscreen: (atom) => {

			const {x, y} = getAtomPosition(atom)

			const height = atom.size
			const width = atom.size * Math.sqrt(3)/2
			
			const left = x
			const right = left + width
			const top = y
			const bottom = top + height

			if (right < 0) return true
			if (bottom < 0) return true
			if (left > canvas.width) return true
			if (top > canvas.height) return true
			return false
		},
	}

	const TRIANGLE_UP = {
		size: COLOURTODE_SQUARE.size,
		draw: (atom) => {

			const {x, y} = getAtomPosition(atom)

			const width = atom.size
			const height = atom.size * Math.sqrt(3)/2
			
			const left = x
			const right = left + width
			const top = y
			const bottom = top + height
			const middleX = left + width/2

			colourTodeContext.fillStyle = atom.colour
			const path = new Path2D()

			path.moveTo(left, bottom)
			path.lineTo(middleX, top)
			path.lineTo(right, bottom)
			path.closePath()
			colourTodeContext.fillStyle = atom.colour
			colourTodeContext.fill(path)
			if (atom.hasBorder) {
				colourTodeContext.lineWidth = BORDER_THICKNESS*1.5
				colourTodeContext.strokeStyle = atom.borderColour
				colourTodeContext.stroke(path)
			}
		},
		overlaps: (atom, x, y) => {
			
			const {x: ax, y: ay} = getAtomPosition(atom)

			const width = atom.size
			const height = atom.size * Math.sqrt(3)/2
			
			const left = ax
			const right = left + width
			const top = ay
			const bottom = top + height

			if (x < left) return false
			if (y < top) return false
			if (x > right) return false
			if (y > bottom) return false

			return true
		},
		offscreen: (atom) => {

			const {x, y} = getAtomPosition(atom)

			const width = atom.size
			const height = atom.size * Math.sqrt(3)/2
			
			const left = x
			const right = left + width
			const top = y
			const bottom = top + height

			if (right < 0) return true
			if (bottom < 0) return true
			if (left > canvas.width) return true
			if (top > canvas.height) return true
			return false
		},
	}

	const TRIANGLE_DOWN = {
		size: COLOURTODE_SQUARE.size,
		draw: (atom) => {

			const {x, y} = getAtomPosition(atom)

			const width = atom.size
			const height = atom.size * Math.sqrt(3)/2
			
			const left = x
			const right = left + width
			const top = y
			const bottom = top + height
			const middleX = left + width/2

			colourTodeContext.fillStyle = atom.colour
			const path = new Path2D()

			path.moveTo(left, top)
			path.lineTo(middleX, bottom)
			path.lineTo(right, top)
			path.closePath()
			colourTodeContext.fillStyle = atom.colour
			colourTodeContext.fill(path)
			if (atom.hasBorder) {
				colourTodeContext.lineWidth = BORDER_THICKNESS*1.5
				colourTodeContext.strokeStyle = atom.borderColour
				colourTodeContext.stroke(path)
			}
		},
		overlaps: (atom, x, y) => {
			
			const {x: ax, y: ay} = getAtomPosition(atom)

			const width = atom.size
			const height = atom.size * Math.sqrt(3)/2
			
			const left = ax
			const right = left + width
			const top = ay
			const bottom = top + height

			if (x < left) return false
			if (y < top) return false
			if (x > right) return false
			if (y > bottom) return false

			return true
		},
		offscreen: (atom) => {

			const {x, y} = getAtomPosition(atom)

			const width = atom.size
			const height = atom.size * Math.sqrt(3)/2
			
			const left = x
			const right = left + width
			const top = y
			const bottom = top + height

			if (right < 0) return true
			if (bottom < 0) return true
			if (left > canvas.width) return true
			if (top > canvas.height) return true
			return false
		},
	}

	const COLOURTODE_TRIANGLE = {
		behindOtherChildren: true,
		expanded: false,
		draw: (atom) => {
			if (atom.direction === "right") TRIANGLE_RIGHT.draw(atom)
			else if (atom.direction === "down") TRIANGLE_DOWN.draw(atom)
			else if (atom.direction === "up") TRIANGLE_UP.draw(atom)
			else TRIANGLE_RIGHT.draw(atom)
		},
		colour: Colour.splash(999),
		overlaps: TRIANGLE_RIGHT.overlaps,
		offscreen: TRIANGLE_RIGHT.offscreen,
		size: COLOURTODE_SQUARE.size,
		width: TRIANGLE_RIGHT.width,
		direction: "right",
		click: (atom) => {
			
			if (atom.parent.isPaddle) {
				atom.parent.pinhole.locked = !atom.parent.pinhole.locked
				updatePaddleRule(atom.parent)
				return
			}

			if (atom.expanded) {
				atom.unexpand(atom)
			}
			else {
				atom.expand(atom)
			}
		},

		expand: (atom) => {
			atom.pad = createChild(atom, TRIANGLE_PAD)
			atom.handle = createChild(atom, TRIANGLE_HANDLE)
			atom.expanded = true

			atom.upPick = createChild(atom, TRIANGLE_PICK_UP)
			atom.rightPick = createChild(atom, TRIANGLE_PICK_RIGHT)
			atom.downPick = createChild(atom, TRIANGLE_PICK_DOWN)
			
			if (atom.direction === "up") atom.upPick.value = true
			if (atom.direction === "right") atom.rightPick.value = true
			if (atom.direction === "down") atom.downPick.value = true
		},

		unexpand: (atom) => {
			deleteChild(atom, atom.pad)
			deleteChild(atom, atom.handle)
			deleteChild(atom, atom.upPick)
			deleteChild(atom, atom.rightPick)
			deleteChild(atom, atom.downPick)
			atom.expanded = false
		},

		highlighter: true,

		// Returns what atom to highlight when being hovered over stuff
		hover: (atom) => {

			if (atom.direction === "up") {
				
				const {x, y} = getAtomPosition(atom)
				const left = x
				const top = y
				const right = x + atom.width
				const bottom = y + atom.height

				const others = getAllBaseAtoms()
				for (const other of others) {
					if (!other.isSquare) continue
					if (other.parent.isPaddle && other.parent.pinhole.locked) continue
					
					const {x: px, y: py} = getAtomPosition(other)
					const pleft = px
					const pright = px + other.width
					const ptop = py
					const pbottom = py + other.height
					
					if (left > pright) continue
					if (right < pleft) continue
					if (bottom-5 > pbottom) continue
					if (bottom < ptop) continue

					return other
				}

				return
			}

			if (atom.direction !== "right") return undefined

			// Get my bounds
			const {x, y} = getAtomPosition(atom)
			const left = x
			const top = y
			const right = x + atom.width
			const bottom = y + atom.height

			for (const paddle of paddles) {

				// Don't pick hidden or filled paddles
				if (!paddle.expanded) continue
				if (paddle.pinhole.locked) continue
				if (paddle.rightTriangle !== undefined) continue

				// Get paddle bounds
				const {x: px, y: py} = getAtomPosition(paddle)
				const pleft = px
				const pright = px + paddle.width
				const ptop = py
				const pbottom = py + paddle.height

				// Check if I am hovering over the paddle
				if (left > pright) continue
				if (right < pleft) continue
				if (top > pbottom) continue
				if (bottom < ptop) continue

				// Return the highlight and the highlighted atom (the paddle)
				return paddle
			}

			return undefined
		},

		place: (atom, paddle) => {

			if (atom.direction === "up") {
				const square = paddle

				if (square.stamp === undefined) {
					square.stamp = "circle"
					square.value.stamp = "circle"
					square.needsColoursUpdate = true
				} else {
					square.stamp = undefined
					square.value.stamp = undefined
					square.needsColoursUpdate = true
				}

				const diagramCell = makeDiagramCell({content: square.value})
				state.brush.colour = makeDiagram({left: [diagramCell]})

				squareTool.toolbarNeedsColourUpdate = true
				circleTool.toolbarNeedsColourUpdate = true
				triangleTool.toolbarNeedsColourUpdate = true
				wideRectangleTool.toolbarNeedsColourUpdate = true
				tallRectangleTool.toolbarNeedsColourUpdate = true
				return
			}
			
			if (atom.direction !== "right") return undefined
			
			giveChild(paddle, atom)
			paddle.rightTriangle = atom
			atom.x = PADDLE.width/2 - atom.width/2
			atom.y = PADDLE.height/2 - atom.height/2
			atom.dx = 0
			atom.dy = 0

			for (const cellAtom of paddle.cellAtoms) {
				if (cellAtom.slotted !== undefined) {
					registerAtom(cellAtom.slotted)
					giveChild(paddle, cellAtom.slotted)
				}
			}

			updatePaddleSize(paddle)

			if (atom.expanded) {
				atom.unexpand(atom)
			}

			atom.attached = true

			unlockMenuTool("circle")

		},

		drag: (atom) => {
			if (!atom.parent.isPaddle) return atom
			const paddle = atom.parent
			if (paddle.pinhole.locked) {
				const clone = makeAtom(COLOURTODE_TRIANGLE)
				clone.direction = atom.direction
				const {x, y} = getAtomPosition(atom)
				hand.offset.x -= atom.x - x
				hand.offset.y -= atom.y - y
				clone.x = x
				clone.y = y
				registerAtom(clone)
				return clone
			}

			atom.attached = false
			freeChild(paddle, atom)
			paddle.rightTriangle = undefined

			for (const cellAtom of paddle.cellAtoms) {
				if (cellAtom.slotted !== undefined) {
					freeChild(paddle, cellAtom.slotted)
					deleteAtom(cellAtom.slotted)
				}
			}

			updatePaddleSize(paddle)
			return atom
		},

	}

	const OPTION_MARGIN = 10
	const CHANNEL_HEIGHT = COLOURTODE_SQUARE.size - OPTION_MARGIN*2
	const OPTION_SPACING = CHANNEL_HEIGHT + OPTION_MARGIN

	const COLOURTODE_PICKER_PAD_MARGIN = OPTION_MARGIN
	const COLOURTODE_PICKER_PAD = {
		draw: COLOURTODE_RECTANGLE.draw,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		grab: (atom) => atom.parent,
		colour: Colour.Grey,
		width: COLOURTODE_PICKER_PAD_MARGIN + 3*(COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN),
		height: COLOURTODE_SQUARE.size,
		y: 0,
		x: COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN,
		dragOnly: true,
		isPicker: true,
	}

	const CHANNEL_IDS = {
		red: 0,
		green: 1,
		blue: 2,
	}

	const CHANNEL_NAMES = [
		"red",
		"green",
		"blue",
	]

	const COLOURTODE_PICKER_CHANNEL = {
		
		//behindChildren: true,
		hasBorder: true,
		draw: COLOURTODE_RECTANGLE.draw,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		width: COLOURTODE_SQUARE.size,
		y: (COLOURTODE_SQUARE.size - CHANNEL_HEIGHT)/2,
		height: CHANNEL_HEIGHT,
		
		grab: (atom) => {
			//if (atom.parent.isSquare) return atom.parent
			return atom
		},

		drag: (atom) => {
			if (atom.parent.isSquare) {
				const square = atom.parent
				square[atom.channelSlot] = undefined
				const channelId = CHANNEL_IDS[atom.channelSlot]
				square.receiveNumber(square, undefined, channelId)
				freeChild(square, atom)
				atom.channelSlot = CHANNEL_NAMES[atom.value.channel]
				atom.updateColours(atom)
				atom.attached = false

				
				atom.needsColoursUpdate = true
				atom.colourTicker = Infinity

				unlockMenuTool("wide_rectangle")
			}

			else if (atom.parent.isTallRectangle) {
				const diamond = atom.parent
				freeChild(diamond, atom)
				diamond.operationAtoms[atom.highlightedSlot] = undefined
				const operationName = atom.highlightedSlot === "padTop"? "add" : "subtract"
				diamond.value[operationName] = undefined
				atom.attached = false
				if (diamond.expanded) {
					diamond.unexpand(diamond)
					diamond.expand(diamond)
				} else {
					const handle = atom.highlightedSlot === "padTop"? "handleTop" : "handleBottom"
					deleteChild(diamond, diamond[handle], {quiet: true})
					deleteChild(diamond, diamond[atom.highlightedSlot], {quiet: true})
					diamond.expand(diamond)
					diamond.unexpand(diamond)
				}
			}

			else if (atom.parent.isPaddle) {
				const paddle = atom.parent
				paddle.chance = undefined
				freeChild(paddle, atom)
				updatePaddleSize(paddle)
			}

			return atom
		},

		construct: (atom) => {
			const values = [false, false, false, false, false, false, false, false, false, true]
			const channel = Random.Uint8 % 3
			atom.value = makeNumber({values, channel})
			atom.needsColoursUpdate = true
			atom.colourId = 0
			atom.dcolourId = 1
			atom.colourTicker = Infinity

			atom.selectionBack = createChild(atom, COLOURTODE_CHANNEL_SELECTION_SIDE)

			const selectionTop = createChild(atom, COLOURTODE_CHANNEL_SELECTION_END)
			atom.selectionTop = selectionTop
			atom.selectionTop.isTop = true
			selectionTop.dragOnly = false

			const selectionBottom = createChild(atom, COLOURTODE_CHANNEL_SELECTION_END)
			atom.selectionBottom = selectionBottom
			atom.selectionBottom.isTop = false
			selectionBottom.dragOnly = false

			atom.positionSelection(atom)
		},

		positionSelection: (atom, start, end, top, bottom) => {
			
			if (!atom.expanded) {

				atom.selectionTop.y = -atom.selectionTop.height
				//atom.selectionTop.x = -atom.selectionTop.height
				
				atom.selectionBottom.y = atom.height
				//atom.selectionBottom.x = -atom.selectionBottom.height

			}
			
			else {
				//const optionSpacing = (atom.height + (COLOURTODE_SQUARE.size - CHANNEL_HEIGHT)/2)
				const optionSpacing = OPTION_SPACING

				atom.selectionTop.y = end - atom.selectionTop.height
				atom.selectionBottom.y = start + optionSpacing - atom.selectionBottom.height

				atom.selectionTop.minY = top - atom.selectionTop.height
				atom.selectionTop.maxY = atom.selectionBottom.y - optionSpacing

				atom.selectionBottom.minY = atom.selectionTop.y + optionSpacing
				atom.selectionBottom.maxY = bottom - atom.selectionBottom.height + optionSpacing
			}

			atom.positionSelectionBack(atom)

			// bring selectors to front!
			const selectionTopId = atom.children.indexOf(atom.selectionTop)
			atom.children.splice(selectionTopId, 1)
			atom.children.push(atom.selectionTop)

			const selectionBottomId = atom.children.indexOf(atom.selectionBottom)
			atom.children.splice(selectionBottomId, 1)
			atom.children.push(atom.selectionBottom)

			if (atom.parent.isTallRectangle) {
				const operationName = atom.highlightedSlot === "padTop"? "add" : "subtract"
				atom.parent.value[operationName] = atom.value
			}

		},

		positionSelectionBack: (atom) => {
			atom.selectionBack.x = -COLOURTODE_CHANNEL_SELECTION_END.height
			atom.selectionBack.y = atom.selectionTop.y
			atom.selectionBack.height = atom.selectionBottom.y - atom.selectionTop.y + atom.selectionTop.height
			atom.selectionBack.width = atom.width + COLOURTODE_CHANNEL_SELECTION_END.height*2
		},

		update: (atom) => {

			if (atom.expanded) {
				if (atom.needsColoursUpdate) {
					atom.needsColoursUpdate = false
					atom.isGradient = true
					atom.gradient = getGradientImageFromColours({
						colours: atom.colours,
						width: atom.width * CT_SCALE,
						height: atom.height * CT_SCALE,
						gradient: atom.gradient
					})
					atom.updateColours(atom)
				}
			}

			if (!atom.expanded && atom.needsColoursUpdate) {
				atom.needsColoursUpdate = false
				
				if (atom.parent.isSquare) {
					
					const channels = []

					for (let i = 0; i < 3; i++) {
						if (i === atom.value.channel) {
							channels[i] = atom.value
						}
						else {
							const values = [true, false, false, false, false, false, false, false, false, false]
							channels[i] = makeNumber({values, channel: i})
						}
					}
					
					const array = makeArray({channels})
					atom.colours = getSplashesArrayFromArray(array)

				}
				else {

					let array = undefined

					for (let i = 0; i < 10; i++) {
						const v = atom.value.values[i]
						if (v === false) continue
						const join = makeArrayFromSplash(`${i}${i}${i}`)
						if (array === undefined) {
							array = join
						} else {
							array.joins.push(join)
						}
					}

					atom.colours = getSplashesArrayFromArray(array)
				}

				atom.isGradient = true
				atom.gradient = getGradientImageFromColours({
					colours: atom.colours,
					width: atom.width * CT_SCALE,
					height: atom.height * CT_SCALE,
					gradient: atom.gradient
				})
			}

			atom.highlightedAtom = undefined
			if (hand.content === atom && hand.state === HAND.DRAGGING) {

				const {x, y} = getAtomPosition(atom)
				let left = x
				let top = y
				let right = x + atom.width
				let bottom = y + atom.height

				if (atom.highlight !== undefined) {
					deleteChild(atom, atom.highlight)
					atom.highlight = undefined
				}

				let winningDistance = Infinity
				let winningSquare = undefined
				let winningSlot = undefined

				const atoms = getAllBaseAtoms()
				for (const square of atoms) {

					const other = square
					if (other.isTallRectangle) {
						if (!other.expanded) continue
						const slotNames = ["padTop", "padBottom"]
						for (const slotName of slotNames) {
							
							let endAtom = other
	
							while (endAtom.isTallRectangle && endAtom.operationAtoms[slotName] !== undefined) {
								endAtom = endAtom.operationAtoms[slotName]
							}
							
							if (!endAtom.isTallRectangle) continue
							if (!endAtom.expanded) continue
	
							const slot = endAtom[slotName]
							const {x: px, y: py} = getAtomPosition(slot)
							const pleft = px
							const pright = px + slot.width
							const ptop = py
							const pbottom = py + slot.height
	
							if (left > pright) continue
							if (right < pleft) continue
							if (bottom < ptop) continue
							if (top > pbottom) continue
	
							atom.highlightedSlot = slotName
							atom.highlightedAtom = slot
							break
	
						}
					} else {

						if (!square.isSquare) continue
						if (!square.expanded) continue

						const {x: px, y: py} = getAtomPosition(square.pickerPad)

						const pleft = px
						const pright = px + square.pickerPad.width
						const ptop = py
						const pbottom = py + square.pickerPad.height

						if (left > pright) continue
						if (right < pleft) continue
						if (bottom < ptop) continue
						if (top > pbottom) continue

						const slots = ["red", "green", "blue"].filter(slot => square[slot] === undefined)
						if (slots.length === 0) continue
						
						const {x: ax, y: ay} = getAtomPosition(square)

						for (const slot of slots) {
							const slotId = CHANNEL_IDS[slot]
							const sx = ax + square.size + OPTION_MARGIN*2 + slotId*(COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN)
							const sy = ay + OPTION_MARGIN
							const distance = Math.hypot(x - sx, y - sy)
							if (distance < winningDistance) {
								winningDistance = distance
								winningSquare = square
								winningSlot = slot
							}
						}
					}

				}

				if (winningSquare !== undefined) {

					const {x: ax, y: ay} = getAtomPosition(winningSquare)
					const slotId = CHANNEL_IDS[winningSlot]

					atom.highlight = createChild(atom, HIGHLIGHT, {bottom: true})
					atom.highlight.hasBorder = true
					atom.highlight.x = ax + winningSquare.size + OPTION_MARGIN + slotId*(OPTION_MARGIN+winningSquare.size)
					atom.highlight.y = ay
					atom.highlight.width = OPTION_MARGIN*2+winningSquare.size
					atom.highlightedAtom = winningSquare
					atom.highlightedSlot = winningSlot
				} else if (atom.highlightedAtom) {
					const {x: ax, y: ay} = getAtomPosition(atom.highlightedAtom)

					atom.highlight = createChild(atom, HIGHLIGHT, {bottom: true})
					atom.highlight.hasBorder = true
					atom.highlight.x = ax
					atom.highlight.y = ay
					atom.highlight.width = atom.highlightedAtom.width
					atom.highlight.height = atom.highlightedAtom.height
				} else {

					left -= OPTION_MARGIN
					right += OPTION_MARGIN
					top -= OPTION_MARGIN
					bottom += OPTION_MARGIN
					
					for (const paddle of paddles) {
						const {x: px, y: py} = getAtomPosition(paddle)
						const pright = px + paddle.width
						const ptop = py
						const pbottom = py + paddle.height

						if (paddle.chance === undefined && paddle.expanded && left <= pright && right >= pright && ((top < pbottom && top > ptop) || (bottom > ptop && bottom < pbottom))) {
							if (atom.highlightPaddle !== undefined) {
								deleteChild(atom, atom.highlightPaddle)
							}
		
							atom.highlightPaddle = createChild(atom, HIGHLIGHT, {bottom: true})
							atom.highlightPaddle.width = HIGHLIGHT_THICKNESS
							atom.highlightPaddle.height = paddle.height
							atom.highlightPaddle.y = ptop
							atom.highlightPaddle.x = pright - HIGHLIGHT_THICKNESS/2
							atom.highlightedPaddle = paddle
							return
						}
					}
				}

			}
			
			if (atom.highlightedAtom === undefined && atom.highlight !== undefined) {
				deleteChild(atom, atom.highlight)
				atom.highlight = undefined
			}
			
			if (atom.highlightPaddle !== undefined) {
				deleteChild(atom, atom.highlightPaddle)
				atom.highlightPaddle = undefined
				atom.highlightedPaddle = undefined
			}

		},

		drop: (atom) => {
			if (atom.highlight !== undefined) {

				if (atom.highlightedAtom.isSquare) {
					const square = atom.highlightedAtom
					const slotId = CHANNEL_IDS[atom.highlightedSlot]
					atom.value.channel = slotId
					/*giveChild(square, atom)
					atom.dx = 0
					atom.dy = 0
					square[atom.highlightedSlot] = atom
					atom.y = OPTION_MARGIN
					atom.x = square.size + OPTION_MARGIN*2 + slotId*(OPTION_MARGIN*square.size)*/
					square.receiveNumber(square, atom.value, slotId, {expanded: atom.expanded})
					deleteAtom(atom)
				} else {
					const diamond = atom.highlightedAtom.parent
					//diamond.unexpand(diamond)
					
					const operationName = atom.highlightedSlot === "padTop"? "add" : "subtract"
					diamond.value[operationName] = atom.value
					diamond.operationAtoms[atom.highlightedSlot] = atom
					atom.x = atom.highlightedAtom.x + OPTION_MARGIN
					atom.y = atom.highlightedAtom.y + atom.highlightedAtom.height/2 - atom.height/2
					atom.dx = 0
					atom.dy = 0
					giveChild(diamond, atom)
					//diamond.expand(diamond)

					atom.attached = true

				}
			} else if (atom.highlightPaddle !== undefined) {
				const paddle = atom.highlightedPaddle
				atom.attached = true
				giveChild(paddle, atom)
				
				paddle.chance = atom
				updatePaddleSize(paddle)
				
				atom.dx = 0
				atom.dy = 0
			}
			
			unlockMenuTool("tall_rectangle")
		},

		click: (atom) => {
			if (!atom.expanded) {
				atom.expanded = true
				atom.colourId = 0
				atom.colourTicker = Infinity
				atom.needsColoursUpdate = true
				atom.createOptions(atom)
			}
			else {
				atom.expanded = false
				atom.deleteOptions(atom)
				atom.needsColoursUpdate = true
			}
		},

		deleteOptions: (atom) => {

			if (atom.options !== undefined) {
				atom.deletedOptions = atom.options
			}

			for (const option of atom.options) {
				if (atom !== option) deleteChild(atom, option)
			}
			atom.needsColoursUpdate = true
			atom.colourTicker = Infinity
			atom.positionSelection(atom)
		},

		updateColours: (atom) => {
			let parentR = undefined
			let parentG = undefined
			let parentB = undefined

			if (atom.parent.isSquare) {

				let redNumber = atom.parent.value.channels[0]
				let greenNumber = atom.parent.value.channels[1]
				let blueNumber = atom.parent.value.channels[2]

				if (redNumber === undefined) redNumber = makeNumber({channel: 0, values: [true, false, false, false, false, false, false, false, false, false]})
				if (greenNumber === undefined) greenNumber = makeNumber({channel: 1, values: [true, false, false, false, false, false, false, false, false, false]})
				if (blueNumber === undefined) blueNumber = makeNumber({channel: 2, values: [true, false, false, false, false, false, false, false, false, false]})

				parentR = makeNumber({values: [...redNumber.values], channel: redNumber.channel})
				parentG = makeNumber({values: [...greenNumber.values], channel: greenNumber.channel})
				parentB = makeNumber({values: [...blueNumber.values], channel: blueNumber.channel})
			}
			else {
				const values = [false, false, false, false, false, false, false, false, false, false]
				parentR = makeNumber({values: [...values], channel: 0})
				parentG = makeNumber({values: [...values], channel: 1})
				parentB = makeNumber({values: [...values], channel: 2})
			}

			const parentChannels = [parentR, parentG, parentB]
			const mainParentChannel = parentChannels[CHANNEL_IDS[atom.channelSlot]]
			if (mainParentChannel !== undefined) mainParentChannel.values = [false, false, false, false, false, false, false, false, false, false]

			if (atom.options !== undefined && atom.options.length > 0) {
				for (let i = 0; i < 10; i++) {

					const option = atom.options[i]
					
					if (atom.parent.isSquare) {
						mainParentChannel.values[9-i] = true
						if (i > 0) mainParentChannel.values[9-i+1] = false
					} else {
						for (const c of parentChannels) {
							c.values[9-i] = true
							if (i > 0) c.values[9-i+1] = false
						}
					}

					const baseArray = makeArray({channels: parentChannels})

					const colours = getSplashesArrayFromArray(baseArray)

					option.colours = colours
					option.colourTicker = Infinity
					if (option !== atom) {
						option.needsColoursUpdateCountdown = i
						option.needsColoursUpdate = false
						//option.needsColoursUpdate = true
						//option.updateColours(option)
					}
				}
			}
		},

		getCenterId: (atom) => {
			let startId = undefined
			let endId = undefined
	
			for (let i = 0; i < atom.value.values.length; i++) {
				const value = atom.value.values[i]
				if (value) {
					if (startId === undefined) startId = i
					endId = i
				}
			}
			return Math.round((endId + startId) / 2)
		},

		getStartAndEndId: (atom) => {
			let startId = undefined
			let endId = undefined
	
			for (let i = 0; i < atom.value.values.length; i++) {
				const value = atom.value.values[i]
				if (value) {
					if (startId === undefined) startId = i
					endId = i
				}
			}
			return [startId, endId]
		},

		createOptions: (atom) => {

			const oldOptions = atom.parent.isSquare ? atom.deletedOptions : undefined
			atom.options = []

			let startId = undefined
			let endId = undefined
	
			for (let i = 0; i < atom.value.values.length; i++) {
				const value = atom.value.values[i]
				if (value) {
					if (startId === undefined) startId = i
					endId = i
				}
			}
	
			if (startId === undefined) throw new Error("[ColourTode] Number cannot be NOTHING. Please let @TodePond know if you see this error!")
			//const centerOptionId = 9 - Math.floor((endId + startId) / 2)
			const centerOptionId = atom.getCenterId(atom)
			
			//const optionSpacing = (atom.height + (COLOURTODE_SQUARE.size - CHANNEL_HEIGHT)/2)
			const optionSpacing = OPTION_SPACING
			let top = (centerOptionId - 9) * optionSpacing
			let bottom = centerOptionId*optionSpacing

			
			const start = top + (9-startId) * optionSpacing
			const end = top + (9-endId) * optionSpacing

			for (let i = 0; i < 10; i++) {
				if (centerOptionId === 9-i) {
					if (oldOptions !== undefined) {
						//atom.isGradient = true
						//atom.gradient = oldOptions[i].gradient
					}
					atom.options.push(atom)
					continue
				}

				const pityTop = i !== 9 - endId + 1
				const pityBottom = i !== 9 - startId - 1
				const option = createChild(atom, {...COLOURTODE_PICKER_CHANNEL_OPTION, pityTop, pityBottom})
				
				if (oldOptions !== undefined) {
					option.isGradient = true
					option.gradient = oldOptions[i].gradient
				}

				option.y = top + i * optionSpacing
				option.value = 9 - i
				//option.colourTicker = Infinity
				//option.needsColoursUpdate = true
				option.needsColoursUpdateCountdown = i
				option.needsColoursUpdate = true
				//option.updateColours(option)
				atom.options.push(option)
			}


			atom.positionSelection(atom, start, end, top, bottom)
			
			atom.updateColours(atom)
		}
	}

	const COLOURTODE_CHANNEL_SELECTION_END = {
		draw: (atom) => {
			const {x, y} = getAtomPosition(atom)

			/*let colour = "pink"
			if (atom.parent !== COLOURTODE_BASE_PARENT) {
				if (atom.parent.parent !== COLOURTODE_BASE_PARENT) {
					const colours = getSplashesArrayFromArray(atom.parent.parent.value)
					colour = colours[Random.Uint32 % colours.length]
				}
			}*/

			/*colourTodeContext.fillStyle = "#000000"
			colourTodeContext.globalCompositeOperation = "lighten"
			colourTodeContext.fillRect(x, y, atom.width, atom.height)
			colourTodeContext.globalCompositeOperation = "source-over"

			colourTodeContext.filter = "invert(1) saturate(0%) brightness(67.5%) contrast(10000%)"

			const X = Math.round(x)
			const Y = Math.round(y)
			const W = Math.round(atom.width)
			const H = Math.round(atom.height)

			colourTodeContext.drawImage(colourTodeCanvas, X, Y, W, H, X, Y, W, H)
			colourTodeContext.filter = "none"*/

			const X = Math.round(x)
			const Y = Math.round(y)
			const W = Math.round(atom.width)
			const H = Math.round(atom.height)

			colourTodeContext.fillStyle = Colour.Grey
			colourTodeContext.fillRect(X, Y, W, H)
			
		},
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		height: OPTION_SPACING - CHANNEL_HEIGHT,
		width: COLOURTODE_SQUARE.size + OPTION_MARGIN*2,
		x: - OPTION_MARGIN,
		//grabbable: false,
		dragOnly: true,
		grab: (atom) => atom.parent.expanded? atom : atom.parent,
		touch: (atom) => atom.parent.expanded? atom : atom.parent,
		cursor: (atom) => {
			return atom.parent.expanded? "ns-resize" : "pointer"
		},
		move: (atom) => {
			atom.parent.positionSelectionBack(atom.parent)
		},
		drop: (atom) => {
			let distanceFromMiddle = Math.round((atom.y+CHANNEL_HEIGHT/2) / OPTION_SPACING)

			const oldNumber = atom.parent.value

			let [startId, endId] = atom.parent.getStartAndEndId(atom.parent)
			let centerId = atom.parent.getCenterId(atom.parent)

			if (atom.isTop) {
				endId = centerId - distanceFromMiddle
			}
			if (!atom.isTop) {
				startId = centerId - (distanceFromMiddle-1)
			}

			const values = [false, false, false, false, false, false, false, false, false, false]
			for (let i = startId; i <= endId; i++) {
				values[i] = true
			}

			const number = makeNumber({channel: oldNumber.channel, values})
			atom.parent.value = number
			atom.parent.deleteOptions(atom.parent)
			atom.parent.createOptions(atom.parent)

			atom.dx = 0
			atom.dy = 0

			
			if (atom.parent.parent.isSquare) {
				const square = atom.parent.parent
				const channel = CHANNEL_IDS[atom.parent.channelSlot]
				square.receiveNumber(square, number, channel)
			}

			if (atom.parent.parent.isPaddle) {
				const paddle = atom.parent.parent
				updatePaddleSize(paddle)
			}

		},
		dragLockX: true,
	}

	const COLOURTODE_CHANNEL_SELECTION_SIDE = {
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		width: (COLOURTODE_SQUARE.size - CHANNEL_HEIGHT)/2,
		height: COLOURTODE_SQUARE.size,
		//grabbable: false,
		grab: (atom) => atom.parent,
		touch: (atom) => atom.parent,
		dragLockX: true,
		draw: COLOURTODE_RECTANGLE.draw,
		colour: Colour.Grey,
	}

	const COLOURTODE_PICKER_CHANNEL_OPTION = {
		draw: COLOURTODE_RECTANGLE.draw,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		height: CHANNEL_HEIGHT,
		width: COLOURTODE_SQUARE.size,
		grab: (atom) => atom.parent,
		hasBorder: true,
		
		colourTicker: Infinity,
		colours: [999],
		colourId: 0,
		dcolourId: 1,
		update: (atom) => {

			if (atom.needsColoursUpdateCountdown >= 0) {
				atom.needsColoursUpdateCountdown--
				if (atom.needsColoursUpdateCountdown < 0) {
					atom.needsColoursUpdate = true
				}
			}

			if (atom.needsColoursUpdate) {
				atom.updateColours(atom)
				atom.needsColoursUpdateCountdown = -1
				atom.needsColoursUpdate = false
			}
		},

		getId: (atom) => {			
			const parent = atom.parent
			const centerId = parent.getCenterId(parent)
			const offset = atom.y / OPTION_SPACING
			return centerId - offset
		},

		updateColours: (atom) => {
			atom.isGradient = true
			atom.gradient = getGradientImageFromColours({
				colours: atom.colours,
				width: atom.width * CT_SCALE,
				height: atom.height * CT_SCALE,
				gradient: atom.gradient
			})
		},

		touch: (atom) => {
			const id = atom.getId(atom)
			if (atom.parent.value.values[id]) return atom.parent
			return atom
		},

		click: (atom) => {

			const values = [false, false, false, false, false, false, false, false, false, false]
			values[atom.value] = true
			const number = makeNumber({values, channel: atom.parent.value.channel})
			const parent = atom.parent
			parent.value = number
			parent.deleteOptions(parent)
			parent.createOptions(parent)
			parent.needsColoursUpdate = true

			if (parent.parent.isSquare) {
				const square = parent.parent
				const channel = CHANNEL_IDS[parent.channelSlot]
				square.receiveNumber(square, number, channel)
			}

			if (parent.parent.isPaddle) {
				const paddle = parent.parent
				updatePaddleSize(paddle)
			}
		},

		construct: (atom) => {

			if (atom.pityTop) {
				const topPity = createChild(atom, COLOURTODE_OPTION_PADDING)
				topPity.y = -topPity.height
			}

			if (atom.pityBottom) {
				const bottomPity = createChild(atom, COLOURTODE_OPTION_PADDING)
				bottomPity.y = atom.height
			}

			//TODO: add cursor pity on the sides too
		}
	}

	const CHANNEL_VARIABLES = [
		"red",
		"green",
		"blue",
	]

	const COLOURTODE_TALL_RECTANGLE = {
		behindChildren: true,
		highlighter: true,
		drag: (atom) => {
			if (atom.parent.isSquare) {
				const square = atom.parent
				square[atom.channelSlot] = undefined
				const channelId = CHANNEL_IDS[atom.channelSlot]
				square.receiveNumber(square, undefined, channelId)
				freeChild(square, atom)
				atom.updateAppearance(atom)
				atom.attached = false
			} else if (atom.parent.isTallRectangle) {
				const diamond = atom.parent
				freeChild(diamond, atom)
				diamond.operationAtoms[atom.highlightedSlot] = undefined
				const operationName = atom.highlightedSlot === "padTop"? "add" : "subtract"
				diamond.value[operationName] = undefined
				if (atom.expanded) {
					atom.unexpand(atom)
					atom.expand(atom)
				}
				atom.attached = false
				if (diamond.expanded) {
					diamond.unexpand(diamond)
					diamond.expand(diamond)
				} else {
					const handle = atom.highlightedSlot === "padTop"? "handleTop" : "handleBottom"
					deleteChild(diamond, diamond[handle], {quiet: true})
					deleteChild(diamond, diamond[atom.highlightedSlot], {quiet: true})
					diamond.expand(diamond)
					diamond.unexpand(diamond)
				}
			}
			return atom
		},
		hover: (atom) => {

			const {x, y} = getAtomPosition(atom)
			const left = x
			const top = y
			const right = x + atom.width
			const bottom = y + atom.height

			let winningDistance = Infinity
			let winningSquare = undefined
			let winningSlot = undefined

			const atoms = getAllBaseAtoms()
			for (const other of atoms) {
				if (other === atom) continue

				if (other.isTallRectangle) {
					if (!other.expanded) continue
					const slotNames = ["padTop", "padBottom"]
					for (const slotName of slotNames) {
						
						let endAtom = other

						while (endAtom.isTallRectangle && endAtom.operationAtoms[slotName] !== undefined) {
							endAtom = endAtom.operationAtoms[slotName]
						}
						
						if (!endAtom.isTallRectangle) continue
						if (!endAtom.expanded) continue

						const slot = endAtom[slotName]
						const {x: px, y: py} = getAtomPosition(slot)
						const pleft = px
						const pright = px + slot.width
						const ptop = py
						const pbottom = py + slot.height

						if (left > pright) continue
						if (right < pleft) continue
						if (bottom < ptop) continue
						if (top > pbottom) continue

						atom.highlightedSlot = slotName
						return slot

					}
					continue
				}

				if (!other.isSquare) continue
				if (!other.expanded) continue

				const {x: px, y: py} = getAtomPosition(other.pickerPad)
				const pleft = px
				const pright = px + other.pickerPad.width
				const ptop = py
				const pbottom = py + other.pickerPad.height

				if (left > pright) continue
				if (right < pleft) continue
				if (bottom < ptop) continue
				if (top > pbottom) continue

				const slots = ["red", "green", "blue"].filter(slot => other[slot] === undefined)
				if (slots.length === 0) continue
				const {x: ax, y: ay} = getAtomPosition(other)

				for (const slot of slots) {
					const slotId = CHANNEL_IDS[slot]
					const sx = ax + other.size + OPTION_MARGIN*2 + slotId*(COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN)
					const sy = ay + OPTION_MARGIN
					const distance = Math.hypot(x - sx, y - sy)
					if (distance < winningDistance) {
						winningDistance = distance
						winningSlot = slot
						winningSquare = other
					}
				}

				if (winningSquare !== undefined) {

					const {x: ax, y: ay} = getAtomPosition(winningSquare)
					const slotId = CHANNEL_IDS[winningSlot]

					atom.highlight = createChild(atom, HIGHLIGHT, {bottom: true})
					atom.highlight.hasBorder = true
					atom.highlight.x = ax + winningSquare.size + OPTION_MARGIN + slotId*(OPTION_MARGIN+winningSquare.size)
					atom.highlight.y = ay
					atom.highlight.width = OPTION_MARGIN*2+winningSquare.size
					atom.highlightedAtom = winningSquare
					atom.highlightedSlot = winningSlot
				}
				
				return
			}
		},
		place: (atom, highlightedAtom) => {

			atom.attached = true
			atom.dx = 0
			atom.dy = 0

			if (!highlightedAtom.isSquare) {
				const diamond = highlightedAtom.parent
				//diamond.unexpand(diamond)
				
				const operationName = atom.highlightedSlot === "padTop"? "add" : "subtract"
				diamond.value[operationName] = atom.value
				diamond.operationAtoms[atom.highlightedSlot] = atom
				atom.x = 0
				atom.y = highlightedAtom.y + highlightedAtom.height/2 - atom.height/2
				giveChild(diamond, atom)
				//diamond.expand(diamond)

				if (atom.expanded) {
					atom.unexpand(atom)
					atom.expand(atom)
				}

				return
			}

			const square = atom.highlightedAtom
			const slotId = CHANNEL_IDS[atom.highlightedSlot]
			square.receiveNumber(square, atom.value, slotId, {expanded: atom.expanded, numberAtom: atom})
			deleteAtom(atom)
		},
		draw: (atom) => {
			const {x, y} = getAtomPosition(atom)

			let size = atom.size
			//if (atom.isTool) size -= BORDER_THICKNESS*2.5

			const height = size
			const width = size
			
			const left = (x)
			let right = left + (width)
			let top = (y)
			//if (atom.isTool) top += BORDER_THICKNESS*1.25
			let bottom = top + (height)
			const middleY = top + (height/2)
			const middleX = left + (width/2)

			colourTodeContext.fillStyle = atom.colour
			const path = new Path2D()

			path.moveTo(...[middleX, top].map(n => (n)))
			path.lineTo(...[right, middleY].map(n => (n)))
			path.lineTo(...[middleX, bottom].map(n => (n)))
			path.lineTo(...[left, middleY].map(n => (n)))

			path.closePath()
			colourTodeContext.fillStyle = atom.colour
			colourTodeContext.fill(path)
			if (atom.hasBorder) {
				colourTodeContext.lineWidth = BORDER_THICKNESS
				colourTodeContext.strokeStyle = atom.borderColour

				if (atom.isTool) {
					colourTodeContext.lineWidth = BORDER_THICKNESS*1.5
					colourTodeContext.strokeStyle = toolBorderColours[atom.colour.splash]
				}
				colourTodeContext.stroke(path)
			}
		},
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		hasBorder: true,
		isTallRectangle: true,
		size: CHANNEL_HEIGHT + OPTION_MARGIN/3*2,
		height: CHANNEL_HEIGHT + OPTION_MARGIN/3*2,
		width: CHANNEL_HEIGHT + OPTION_MARGIN/3*2,
		construct: (atom) => {
			atom.variable = CHANNEL_VARIABLES[Random.Uint8 % 3]
			atom.value = makeNumber({variable: atom.variable})
			atom.updateAppearance(atom)
			if (!atom.isTool) {
				atom.width += BORDER_THICKNESS/2
				atom.height += BORDER_THICKNESS/2
				atom.size += BORDER_THICKNESS/2
			}
			atom.operationAtoms = {padTop: undefined, padBottom: undefined}

		},
		makeOperationAtoms: (atom) => {
			if (atom.value.add !== undefined) {

				if (atom.operationAtoms.padtop === undefined) {
					if (atom.value.add.variable === undefined) {
						const operationAtom = createChild(atom, COLOURTODE_PICKER_CHANNEL)
						operationAtom.value = atom.value.add
						atom.operationAtoms.padTop = operationAtom
						operationAtom.x = atom.padTop.x + OPTION_MARGIN
						operationAtom.y = atom.padTop.y + atom.padTop.height/2 - operationAtom.height/2
						operationAtom.highlightedSlot = "padTop"
					} else {
						const operationAtom = createChild(atom, COLOURTODE_TALL_RECTANGLE)
						operationAtom.value = atom.value.add
						operationAtom.variable = atom.value.add.variable
						operationAtom.makeOperationAtoms(operationAtom)
						operationAtom.highlightedSlot = "padTop"
						operationAtom.x = 0
						operationAtom.y = atom.padTop.y + atom.padTop.height/2 - operationAtom.height/2
						operationAtom.updateAppearance(operationAtom)
						atom.operationAtoms.padTop = operationAtom
					}
				}
			}

			if (atom.value.subtract !== undefined) {

				if (atom.operationAtoms.padBottom === undefined) {
					if (atom.value.subtract.variable === undefined) {
						const operationAtom = createChild(atom, COLOURTODE_PICKER_CHANNEL)
						operationAtom.value = atom.value.subtract
						atom.operationAtoms.padBottom = operationAtom
						operationAtom.x = atom.padBottom.x + OPTION_MARGIN
						operationAtom.y = atom.padBottom.y + atom.padBottom.height/2 - operationAtom.height/2
						operationAtom.highlightedSlot = "padBottom"
					} else {

					}
				}
			}
		},
		updateAppearance: (atom) => {
			if (atom.variable === "red") {
				atom.colour = Colour.Red
			} else if (atom.variable === "green") {
				atom.colour = Colour.Green
			} else if (atom.variable === "blue") {
				atom.colour = Colour.Blue
			}

			atom.borderColour = borderColours[atom.colour.splash]
		},
		expanded: false,
		click: (atom) => {
			if (!atom.expanded) {
				atom.expand(atom)
			} else {
				atom.unexpand(atom)
			}
		},
		expand: (atom) => {
			atom.expanded = true

			if (atom.value.add === undefined) {
				if (atom.y < 0 || !(atom.parent.isTallRectangle && atom.parent.operationAtoms.padBottom === atom)) {
					atom.handleTop = createChild(atom, SYMMETRY_HANDLE)
					atom.handleTop.width = atom.handleTop.height
					atom.handleTop.height *= 2
					atom.handleTop.y = atom.height/2 - atom.handleTop.height
					atom.handleTop.x = atom.width/2 - atom.handleTop.width/2
					atom.handleTop.behindParent = true

					atom.padTop = createChild(atom, SYMMETRY_PAD)
					atom.padTop.height = COLOURTODE_PICKER_PAD.height
					atom.padTop.width = COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN*2
					atom.padTop.x = atom.width/2 - atom.padTop.width/2
					atom.padTop.y = -atom.padTop.height - OPTION_MARGIN
				}
			}

			if (atom.value.subtract === undefined) {
				if (atom.y > 0 || !(atom.parent.isTallRectangle && atom.parent.operationAtoms.padTop === atom)) {
					atom.handleBottom = createChild(atom, SYMMETRY_HANDLE)
					atom.handleBottom.width = atom.handleBottom.height
					atom.handleBottom.height *= 2
					atom.handleBottom.y = atom.height/2
					atom.handleBottom.x = atom.width/2 - atom.handleBottom.width/2
					atom.handleBottom.behindParent = true

					atom.padBottom = createChild(atom, SYMMETRY_PAD)
					atom.padBottom.height = COLOURTODE_PICKER_PAD.height
					atom.padBottom.width = COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN*2
					atom.padBottom.x = atom.width/2 - atom.padBottom.width/2
					atom.padBottom.y = atom.height + OPTION_MARGIN
				}
			}
			
			atom.handleRight = createChild(atom, SYMMETRY_HANDLE)
			atom.handleRight.y = atom.height/2 - atom.handleRight.height/2
			atom.handleRight.x = atom.width/2
			atom.handleRight.width *= 2.5
			atom.handleRight.behindParent = true

			atom.padRight = createChild(atom, SYMMETRY_PAD)
			atom.padRight.height = COLOURTODE_PICKER_PAD.height
			atom.padRight.width = OPTION_MARGIN + (atom.width+OPTION_MARGIN/1.5)*3
			atom.padRight.y = atom.height/2 - atom.padRight.height/2
			atom.padRight.x = atom.width/2 + (COLOURTODE_SQUARE.size + COLOURTODE_PICKER_PAD_MARGIN*2)/2 + OPTION_MARGIN
			
			/*atom.handleLeft = createChild(atom, SYMMETRY_HANDLE)
			atom.handleLeft.y = atom.height/2 - atom.handleLeft.height/2
			atom.handleLeft.x = -atom.width/2 - atom.handleLeft.width
			atom.handleLeft.width *= 2

			atom.padLeft = createChild(atom, SYMMETRY_PAD)
			atom.padLeft.height = COLOURTODE_PICKER_PAD.height
			atom.padLeft.width = OPTION_MARGIN + (atom.width+OPTION_MARGIN/1.5)*3
			atom.padLeft.y = atom.height/2 - atom.padRight.height/2
			atom.padLeft.x = -atom.padLeft.width - OPTION_MARGIN*/

			atom.red = createChild(atom, DIAMOND_CHOICE)
			atom.red.x = atom.padRight.x + OPTION_MARGIN/Math.SQRT2
			atom.red.borderColour = Colour.Red
			atom.red.colour = Colour.Black
			atom.red.value = "red"

			atom.green = createChild(atom, DIAMOND_CHOICE)
			atom.green.x = atom.padRight.x + OPTION_MARGIN/Math.SQRT2 + (atom.green.width+OPTION_MARGIN)*1
			atom.green.borderColour = Colour.Green
			atom.green.colour = Colour.Black
			atom.green.value = "green"
			
			atom.blue = createChild(atom, DIAMOND_CHOICE)
			atom.blue.x = atom.padRight.x + OPTION_MARGIN/Math.SQRT2 + (atom.blue.width+OPTION_MARGIN)*2
			atom.blue.borderColour = Colour.Blue
			atom.blue.colour = Colour.Black
			atom.blue.value = "blue"

			atom.winnerPin = createChild(atom, DIAMOND_PIN)
			atom.winnerPin.x = atom[atom.variable].x + atom.winnerPin.width/2
			atom.winnerPin.y = atom.winnerPin.height/2
			atom.winnerPin.colour = atom[atom.variable].borderColour
			atom.winnerPin.borderColour = atom.winnerPin.colour

			for (const operation of ["padTop", "padBottom"]) {
				const operationAtom = atom.operationAtoms[operation]
				if (operationAtom === undefined) continue
				registerAtom(operationAtom)
				giveChild(atom, operationAtom)
			}

			for (const child of atom.children) {
				if (!child.isTallRectangle) continue
				if (child.expanded) {
					child.unexpand(child)
					child.expand(child)
				}
			}

		},
		unexpand: (atom) => {
			atom.expanded = false

			deleteChild(atom, atom.red)
			deleteChild(atom, atom.green)
			deleteChild(atom, atom.blue)

			deleteChild(atom, atom.padRight)
			deleteChild(atom, atom.handleRight)
			deleteChild(atom, atom.winnerPin)
			
			if (atom.value.add === undefined) {
				deleteChild(atom, atom.padTop, {quiet: true})
				deleteChild(atom, atom.handleTop, {quiet: true})
			}
			
			if (atom.value.subtract === undefined) {
				deleteChild(atom, atom.padBottom, {quiet: true})
				deleteChild(atom, atom.handleBottom, {quiet: true})
			}
			
			/*deleteChild(atom, atom.padLeft)
			deleteChild(atom, atom.handleLeft)*/

			/*for (const opera
				tion of ["padTop", "padBottom"]) {
				const operationAtom = atom.operationAtoms[operation]
				if (operationAtom === undefined) continue
				deleteChild(atom, operationAtom)
			}*/

		}
	}

	const DIAMOND_CHOICE = {
		draw: (atom) => {
			COLOURTODE_TALL_RECTANGLE.draw(atom)
		},
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		hasBorder: true,
		size: CHANNEL_HEIGHT + OPTION_MARGIN/3*2,
		height: CHANNEL_HEIGHT + OPTION_MARGIN/3*2,
		width: CHANNEL_HEIGHT + OPTION_MARGIN/3*2,
		grab: (atom) => atom.parent,
		click: (atom) => {
			if (atom.value === atom.parent.variable) return

			atom.parent.variable = atom.value			
			atom.parent.value.variable = atom.value

			atom.parent.winnerPin.x = atom.x + atom.parent.winnerPin.width/2
			atom.parent.winnerPin.colour = atom.borderColour
			atom.parent.winnerPin.borderColour = atom.borderColour

			atom.parent.updateAppearance(atom.parent)

			const diamond = atom.parent
			let topDiamond = diamond
			let top = diamond.parent
			while (!top.isSquare) {
				if (top === COLOURTODE_BASE_PARENT) return
				topDiamond = top
				top = top.parent
			}

			let channelNumber = 0
			if (topDiamond.channelSlot === "green") channelNumber = 1
			if (topDiamond.channelSlot === "blue") channelNumber = 2

			const topChannel = top.variableAtoms[channelNumber]
			top.receiveNumber(top, topChannel.value, channelNumber, {expanded: topChannel.expanded, numberAtom: topChannel})

		}
	}
	
	const DIAMOND_PIN = {
		draw: (atom) => {
			COLOURTODE_TALL_RECTANGLE.draw(atom)
		},
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		hasBorder: true,
		size: (CHANNEL_HEIGHT + OPTION_MARGIN/3*2) / 2,
		height: (CHANNEL_HEIGHT + OPTION_MARGIN/3*2) / 2,
		width: (CHANNEL_HEIGHT + OPTION_MARGIN/3*2) / 2,
		grab: (atom) => atom.parent,
		touch: (atom) => atom.parent,
	}
	
	const COLOURTODE_OPTION_PADDING = {
		draw: () => {},
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		grab: (atom) => atom.parent.parent,
		touch: (atom) => atom.parent,
		colour: Colour.Grey,
		width: COLOURTODE_SQUARE.size,
		height: OPTION_SPACING - CHANNEL_HEIGHT,
		y: 0,
		x: 0,
		//dragOnly: true,
	}

	paddles = []

	const PADDLE_MARGIN = COLOURTODE_SQUARE.size/2
	const PADDLE = {
		stayAtBack: true,
		attached: true,
		noDampen: true,
		isPaddle: true,
		behindChildren: true,
		draw: COLOURTODE_RECTANGLE.draw,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		colour: Colour.Grey,
		size: COLOURTODE_SQUARE.size + OPTION_MARGIN*4, //for legacy
		width: COLOURTODE_SQUARE.size + OPTION_MARGIN*4,
		height: COLOURTODE_SQUARE.size + OPTION_MARGIN*4,
		dragOnly: true,
		dragLockY: true,
		scroll: 0,
		x: Math.round(PADDLE_MARGIN), //needed for handle creation
		y: COLOURTODE_SQUARE.size + OPTION_MARGIN + PADDLE_MARGIN,
		construct: (paddle) => {

			paddle.cellAtoms = []
			paddle.slots = []

			const handle = createChild(paddle, PADDLE_HANDLE)
			paddle.handle = handle
			paddle.setLimits(paddle)
			paddle.x = paddle.minX
			paddle.expanded = false

			paddle.pinhole = createChild(handle, PIN_HOLE)

			updatePaddleSize(paddle)


		},

		setLimits: (paddle) => {
			paddle.maxX = paddle.handle.width
			paddle.minX = paddle.handle.width - paddle.width
		},

		drop: (paddle) => {

			const distanceFromMax = paddle.maxX - paddle.x
			const distanceFromMin = paddle.x - paddle.minX

			if (distanceFromMax < distanceFromMin) {
				paddle.x = paddle.maxX
				paddle.expanded = true
				updatePaddleRule(paddle)

				if (paddles.last === paddle) {
					createPaddle()
				}

			} else {
				paddle.x = paddle.minX
				paddle.expanded = false
				updatePaddleRule(paddle)

				if (paddles.last !== paddle) {
					deletePaddle(paddle)
				}
			}
			paddle.dx = 0
		},

		drag: (paddle, x, y) => {
			if (paddle.pinhole.locked) {
				const square = makeAtom(COLOURTODE_SQUARE)
				hand.offset.x = -square.width/2
				hand.offset.y = -square.height/2
				const cells = makeDiagramCellsFromCellAtoms(paddle.cellAtoms)
				const diagram = makeDiagram({left: cells})
				normaliseDiagram(diagram)

				square.value = diagram
				registerAtom(square)
				state.brush.colour = makeDiagram({left: [makeDiagramCell({content: diagram})]})
				square.update(square)
				return square
			}
			return paddle
		}
	}

	const fillPoints = (colour, points) => {
		
		const path = new Path2D()
		const [head, ...tail] = points
		path.moveTo(...head.map(n => Math.round(n)))
		for (const point of tail) {
			path.lineTo(...point.map(n => Math.round(n)))
		}
		path.closePath()

		colourTodeContext.fillStyle = colour
		colourTodeContext.fill(path)
	}

	const SLOT = {
		isSlot: true,
		behindChildren: true,
		//hasBorder: true,
		//borderColour: Colour.Silver,
		draw: (atom) => {
			//atom.colour = borderColours[atom.cellAtom.colour.splash]
			//COLOURTODE_RECTANGLE.draw(atom)
			
			const [x, y] = getAtomPosition(atom)

			const left = x
			const right = x + atom.width
			const top = y
			const bottom = y + atom.height

			/*const swidth = atom.width/10
			const sheight = atom.height/10

			const stripes = [
				[
					[left, top],
					[left + swidth*1, top],
					[left, top + sheight*1],
				],
				[
					[left + swidth*4, top],
					[left + swidth*6, top],
					[left, top + swidth*6],
					[left, top + swidth*4],
				],
				[
					[left + swidth*9, top],
					[right, top],
					[right, top + sheight],
					[left + swidth, bottom],
					[left, bottom],
					[left, top + swidth*9],
				],
				[
					[left + swidth*9, bottom],
					[right, top + sheight * 9],
					[right, bottom],
				],
				[
					[left + swidth*4, bottom],
					[left + swidth*6, bottom],
					[right, top + sheight * 6],
					[right, top + sheight * 4],
				],
			]

			for (const stripe of stripes) {
				fillPoints(Colour.Black, stripe)
			}*/

			colourTodeContext.fillStyle = atom.colour
			/*colourTodeContext.beginPath()
			colourTodeContext.arc(x + atom.width/2, y+atom.height/2, atom.width / 5, 0, 2*Math.PI)
			colourTodeContext.fill()*/

			const w = atom.width/3
			const h = atom.width/3
			const X = x + atom.width/2 - w/2
			const Y = y + atom.height/2 - h/2
			colourTodeContext.fillRect(...[X, Y, w, h].map(n => Math.round(n)))

		},
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		colour: Colour.Black,
		size: COLOURTODE_SQUARE.size,
		grab: (atom) => atom.parent,
		dragOnly: true,
	}

	const updatePaddleSize = (paddle) => {
		
		let width = PADDLE.width
		let height = PADDLE.size

		if (paddle.cellAtoms.length > 0) {
			let top = Infinity
			let bottom = -Infinity
			let right = -Infinity
			let left = Infinity

			for (const cellAtom of paddle.cellAtoms) {
				const cx = cellAtom.x
				const cy = cellAtom.y
				const cleft = cx
				const cright = cx + cellAtom.width
				const ctop = cy
				const cbottom = cy + cellAtom.height

				if (cleft < left) left = cleft
				if (cright > right) right = cright
				if (ctop < top) top = ctop
				if (cbottom > bottom) bottom = cbottom
			}

			let topOffset = 0
			let leftOffset = 0

			const yPadding = (PADDLE.height/2 - COLOURTODE_SQUARE.size/2)
			const xPadding = (PADDLE.width/2 - COLOURTODE_SQUARE.size/2)

			const desiredTop = yPadding
			const desiredLeft = xPadding

			if (top !== desiredTop) {
				topOffset = desiredTop - top
				bottom += topOffset
			}
			if (left !== desiredLeft) {
				leftOffset = desiredLeft - left
				right += leftOffset
			}

			for (const cellAtom of paddle.cellAtoms) {
				cellAtom.y += topOffset
				cellAtom.x += leftOffset
			}

			const desiredWidth = right + xPadding
			const desiredHeight = bottom + yPadding

			width = desiredWidth
			height = desiredHeight

		}

		if (paddle.rightTriangle !== undefined) {
			paddle.rightTriangle.x = width
			paddle.rightTriangle.y = height/2 - paddle.rightTriangle.height/2
			width = width+width + paddle.rightTriangle.width
		}
		
		if (paddle.hasSymmetry || paddle.chance !== undefined) {
			width += SYMMETRY_CIRCLE.size/3
		}

		paddle.width = width
		paddle.height = height
		paddle.setLimits(paddle)

		//=============================//
		// ARRANGING PADDLE's CHILDREN //
		//=============================//
		
		for (const slot of paddle.slots) {
			deleteChild(paddle, slot)
		}
		paddle.slots = []

		if (paddle.rightTriangle !== undefined) {
			for (const cellAtom of paddle.cellAtoms) {

				const slot = createChild(paddle, SLOT, {bottom: true})
				cellAtom.slot = slot
				paddle.slots.push(slot)
				slot.x = cellAtom.x + paddle.rightTriangle.x + paddle.rightTriangle.width
				slot.y = cellAtom.y
				slot.cellAtom = cellAtom

				if (cellAtom.slotted !== undefined) {
					cellAtom.slotted.x = cellAtom.x + paddle.rightTriangle.x + paddle.rightTriangle.width
					cellAtom.slotted.y = cellAtom.y
					slot.colour = Colour.Grey
				}
				
			}
		}

		if (paddle.symmetryCircle !== undefined) {
			paddle.symmetryCircle.x = paddle.width - paddle.symmetryCircle.width/2
			paddle.symmetryCircle.y = paddle.height/2 - paddle.symmetryCircle.height/2
		}

		if (paddle.chance !== undefined) {
			paddle.chance.x = paddle.width - paddle.chance.width/2
			paddle.chance.y = paddle.height/2 - paddle.chance.height/2
		}

		if (paddle.chance !== undefined && paddle.symmetryCircle !== undefined) {
			paddle.symmetryCircle.y -= paddle.symmetryCircle.height/2
			paddle.chance.y += paddle.symmetryCircle.height/2
			if (paddle.height > 100) {
				paddle.symmetryCircle.y -= OPTION_MARGIN/2
				paddle.chance.y += OPTION_MARGIN/2
			}
		}
		
		paddle.handle.y = paddle.height/2 - paddle.handle.height/2

		updatePaddleRule(paddle)
		positionPaddles()
	}

	const isDragonArraySingleColour = (array) => {
		const splashes = getSplashesSetFromArray(array)
		return splashes.size === 1
	}

	const isDragonArrayEqual = (a, b) => {

		for (let i = 0; i < 3; i++) {
			const achannel = a.channels[i]
			const bchannel = b.channels[i]
			if (achannel === undefined && bchannel !== undefined) return false
			if (achannel !== undefined && bchannel === undefined) return false
			if (achannel === undefined && bchannel === undefined) continue
			if (achannel.variable !== bchannel.variable) return false
		}

		const asplashes = getSplashesArrayFromArray(a)
		const bsplashes = getSplashesArrayFromArray(b)

		for (const asplash of asplashes) {
			const id = bsplashes.indexOf(asplash)
			if (id === -1) return false
			bsplashes.splice(id, 1)
		}

		if (bsplashes.length > 0) return false

		return true

	}

	const applyRangeStamp = (stampeds, value) => {
		if (value.stamp) return //already got a manual stamp
		const isSingle = isDragonArraySingleColour(value)
		if (!isSingle) {
			let newStamp = undefined
			for (let i = 0; i < stampeds.length; i++) {
				const stamped = stampeds[i]
				if (isDragonArrayEqual(stamped, value)) {
					newStamp = i
					break
				}
			}
			if (newStamp === undefined) {
				newStamp = stampeds.length
				stampeds.push(value)
			}
			value.stamp = newStamp.toString()
		}
	}

	const getTopLeftOfCellAtoms = (cellAtoms) => {
		let smallestX = Infinity
		let smallestY = Infinity
		let leader = undefined

		for (const cellAtom of cellAtoms) {
			if (cellAtom.x <= smallestX) {
				if (cellAtom.y <= smallestY) {
					leader = cellAtom
					smallestX = cellAtom.x
					smallestY = cellAtom.y
				}
			}
		}

		return leader
	}

	const getOrderedCellAtoms = (cellAtoms) => {
		const orderedCellAtoms = [...cellAtoms].sort((a, b) => {
			if (a.x < b.x) return -1
			if (a.x > b.x) return 1
			if (a.y < b.y) return -1
			if (a.y > b.y) return 1
			return 0
		})
		return orderedCellAtoms
	}

	const makeDiagramCellsFromCellAtoms = (cellAtoms) => {

		const orderedCellAtoms = getOrderedCellAtoms(cellAtoms)
		const origin = orderedCellAtoms[0]
		const diagramCells = []

		for (const cellAtom of cellAtoms) {
			const x = (cellAtom.x - origin.x) / cellAtom.width
			const y = (cellAtom.y - origin.y) / cellAtom.height

			const leftClone = cloneDragonArray(cellAtom.value) //TODO: should act different for multis
			const diagramCell = makeDiagramCell({x, y, content: leftClone})
			diagramCells.push(diagramCell)

		}

		return diagramCells

	}

	const updatePaddleRule = (paddle) => {

		if (!paddle.expanded) return

		if (paddle.rightTriangle !== undefined) {
			if (paddle.pinhole.locked) {
				paddle.rightTriangle.colour = Colour.splash(999)
			} else {
				paddle.rightTriangle.colour = Colour.splash(000)
			}
		}

		let transformations = DRAGON_TRANSFORMATIONS.NONE
		if (paddle.hasSymmetry) {
			const [x, y, r] = getXYR(paddle.symmetryCircle.value)

			const isX = x > 0
			const isY = y > 0
			const isR = r > 0

			let key = `${isY? "X" : ""}${isX? "Y" : ""}${isR? "R" : ""}`
			if (key === "") key = "NONE"
			else if (key === "XR" || key === "YR") key = "XYR"

			transformations = DRAGON_TRANSFORMATIONS[key]
		}

		const orderedCellAtoms = getOrderedCellAtoms(paddle.cellAtoms)
		const origin = orderedCellAtoms[0]
		const left = []
		const right = []
		const stampeds = []
		for (const cellAtom of orderedCellAtoms) {
			const x = (cellAtom.x - origin.x) / cellAtom.width
			const y = (cellAtom.y - origin.y) / cellAtom.height

			//======//
			// LEFT //
			//======//
			if (cellAtom.value.isDiagram) {

				// Check for every mini-cell
				const orderedMiniLeftCells = getOrderedCellAtoms(cellAtom.value.left)
				for (const miniDiagramCell of orderedMiniLeftCells) {
					const miniClone = cloneDragonArray(miniDiagramCell.content)
					applyRangeStamp(stampeds, miniClone)
					const miniX = x + miniDiagramCell.x
					const miniY = y + miniDiagramCell.y
					const diagramCell = makeDiagramCell({
						x: miniX,
						y: miniY,
						width: miniDiagramCell.width,
						height: miniDiagramCell.height,
						content: miniClone,
					})
					left.push(diagramCell)
				}

			} else {
				
				// Just check for a single cell
				const leftClone = cloneDragonArray(cellAtom.value)
				applyRangeStamp(stampeds, leftClone)
				const diagramCell = makeDiagramCell({x, y, content: leftClone})
				left.push(diagramCell)
			}

			
			//=======//
			// RIGHT //
			//=======//

			// Merge!!!
			if (cellAtom.value.isDiagram) {
				const maxiLeft = makeMaximisedDiagram(cellAtom.value)
				const [maxiWidth, maxiHeight] = getDiagramDimensions(maxiLeft)
				
				const mergeCell = makeDiagramCell({
					x,
					y,
					instruction: DRAGON_INSTRUCTION.merge,
					splitX: maxiWidth,
					splitY: maxiHeight,
				})

				right.push(mergeCell)
			}

			const rightContent = cellAtom.slotted === undefined? undefined : cellAtom.slotted.value

			if (rightContent === undefined) {
				const nothingCell = makeDiagramCell({
					x,
					y,
					instruction: DRAGON_INSTRUCTION.nothing,
				})

				right.push(nothingCell)

			} else if (rightContent.isDiagram) {

				// Split the cell into mini-cells!
				const maxiRight = makeMaximisedDiagram(rightContent)
				const [maxiWidth, maxiHeight] = getDiagramDimensions(maxiRight)
				
				const splitCell = makeDiagramCell({
					x,
					y,
					instruction: DRAGON_INSTRUCTION.split,
					splitX: maxiWidth,
					splitY: maxiHeight,
				})

				right.push(splitCell)

				// Recolour every mini-cell!
				const orderedMiniRightCells = getOrderedCellAtoms(rightContent.left)
				for (const miniDiagramCell of orderedMiniRightCells) {
					const miniClone = cloneDragonArray(miniDiagramCell.content)
					applyRangeStamp(stampeds, miniClone)
					const miniX = x + miniDiagramCell.x
					const miniY = y + miniDiagramCell.y
					const diagramCell = makeDiagramCell({
						x: miniX,
						y: miniY,
						width: miniDiagramCell.width,
						height: miniDiagramCell.height,
						content: miniClone,
						instruction: DRAGON_INSTRUCTION.recolour,
					})
					right.push(diagramCell)
				}

			} else {

				// Just recolour a single cell
				const rightClone = cloneDragonArray(rightContent)
				applyRangeStamp(stampeds, rightClone)
				const rightDiagramCell = makeDiagramCell({x, y, content: rightClone})
				right.push(rightDiagramCell)
			}
		}
		
		const diagram = makeMaximisedDiagram(makeDiagram({left, right}))

		const locked = paddle.pinhole.locked
		const chance = paddle.chance === undefined? undefined : paddle.chance.value
		const rule = makeRule({steps: [diagram], transformations, locked, chance})
		paddle.rule = rule
		if (paddle.registry !== undefined) {
			unregisterRegistry(paddle.registry)
		}
		if (locked && paddle.rightTriangle !== undefined) {
			//debugRule(rule)
			paddle.registry = registerRule(rule)
			//debugRegistry(paddle.registry, {redundants: false})
		}
	}

	const getAllAtoms = (pool = state.colourTode.atoms) => {
		const atoms = [...pool]
		for (const atom of atoms) {
			atoms.push(...getAllAtoms(atom.children))
		}
		return atoms
	}

	const getAllBaseAtoms = () => {
		const atoms = [...state.colourTode.atoms]
		for (const paddle of paddles) {
			for (const child of paddle.children) {
				if (child.isPinhole) continue
				if (child.isPaddleHandle) continue
				atoms.push(child)
			}
		}
		for (const atom of atoms) {
			if (atom.isSquare && atom.expanded) atoms.push(...atom.children)
		}
		return atoms
	}

	const positionPaddles = () => {

		if (paddles.length > 1) {
			unlockMenuTool("triangle")
		}

		let previous = undefined
		for (const paddle of paddles) {
			if (previous === undefined) {
				paddle.y = PADDLE.y + PADDLE.scroll
				previous = paddle
				continue
			}

			paddle.y = previous.y + previous.height + PADDLE_MARGIN
			previous = paddle
			//bringAtomToBack(paddle) //causes bug where circle tool disappears but really shouldn't :(
		}
	}

	const deletePaddle = (paddle, id = paddles.indexOf(paddle)) => {
		paddles.splice(id, 1)
		if (paddle.registry !== undefined) {
			unregisterRegistry(paddle.registry)
		}
		deleteAtom(paddle)
		positionPaddles()
	}

	const createPaddle = () => {
		const paddle = makeAtom(PADDLE)
		
		paddles.push(paddle)
		positionPaddles()

		registerAtom(paddle)
	}

	const PADDLE_HANDLE = {
		isPaddleHandle: true,
		attached: true,
		behindChildren: true,
		draw: COLOURTODE_RECTANGLE.draw,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		colour: Colour.Grey,
		size: PADDLE.x,
		x: -PADDLE.x,
		y: PADDLE.size/2 - PADDLE.x/2,
		touch: (atom) => atom.parent.pinhole,
		grab: (atom) => {
			//if (atom.parent.pinhole.locked) return 
			return atom.parent.pinhole
		},
	}

	const CIRCLE = {
		draw: (atom) => {
			const {x, y} = getAtomPosition(atom)

			const X = x + atom.width/2
			const Y = y + atom.height/2
			let R = (atom.width/2)

			if (atom.hasBorder) {
				if (atom.isTool) {
					atom.borderColour = toolBorderColours[atom.colour.splash]
				}
				colourTodeContext.fillStyle = atom.borderColour !== undefined? atom.borderColour : Colour.Void
				colourTodeContext.beginPath()
				colourTodeContext.arc(X, Y, R, 0, 2*Math.PI)
				colourTodeContext.fill()
				let borderScale = atom.borderScale !== undefined? atom.borderScale : 1.0
				R = (atom.width/2 - BORDER_THICKNESS*1.5 * borderScale)
			}

			colourTodeContext.fillStyle = atom.colour
			colourTodeContext.beginPath()
			colourTodeContext.arc(X, Y, R, 0, 2*Math.PI)
			colourTodeContext.fill()

		},
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		
	}

	const PIN_HOLE = {
		isPinhole: true,
		attached: true,
		locked: false,
		borderScale: 1/2,
		borderColour: Colour.Black,
		draw: (atom) => {
			if (atom.locked) {
				atom.hasBorder = true
				atom.colour = Colour.Grey				
			}
			else {
				atom.hasBorder = false
				atom.colour = Colour.Black
			}
			CIRCLE.draw(atom)
		},
		overlaps: CIRCLE.overlaps,
		offscreen: CIRCLE.offscreen,
		colour: Colour.Black,
		size: PADDLE_HANDLE.size - OPTION_MARGIN/2,
		y: OPTION_MARGIN/2/2,
		x: OPTION_MARGIN/2/2,
		click: (atom) => {
			const handle = atom.parent
			const paddle = handle.parent
			if (atom.locked) {
				atom.locked = false
				paddle.grabbable = true
				//handle.grabbable = true
				handle.draggable = true
				paddle.draggable = true
				atom.draggable = true
				//paddle.dragOnly = true
				updatePaddleRule(paddle)
			} 

			else {
				atom.locked = true
				//paddle.grabbable = false
				//handle.grabbable = false
				handle.draggable = false
				//paddle.draggable = false
				atom.draggable = false

				for (const cellAtom of paddle.cellAtoms) {
					if (cellAtom.expanded) {
						cellAtom.unexpand(cellAtom)
					}
					if (cellAtom.slotted !== undefined) {
						const slotted = cellAtom.slotted
						if (slotted.expanded) {
							slotted.unexpand(slotted)
						}
					}
					if (cellAtom.joins.length > 0 && cellAtom.joinExpanded) {
						cellAtom.joinUnepxand(cellAtom)
					}
				}

				/*if (paddle.hasSymmetry) {
					if (paddle.symmetryCircle.expanded) {
						paddle.symmetryCircle.unexpand(paddle.symmetryCircle)
					}
				}*/

				if (paddle.cellAtoms.length === 0) {
					paddle.grabbable = false
					paddle.draggable = false
				}
				//paddle.dragOnly = false
				updatePaddleRule(paddle)
			}
		},
		grab: (atom) => atom.parent.parent,
		
	}

	const SYMMETRY_TOGGLINGS = new Map()
	SYMMETRY_TOGGLINGS.set(000, DRAGON_TRANSFORMATIONS.NONE)
	SYMMETRY_TOGGLINGS.set(100, DRAGON_TRANSFORMATIONS.X)
	SYMMETRY_TOGGLINGS.set(010, DRAGON_TRANSFORMATIONS.Y)
	SYMMETRY_TOGGLINGS.set(110, DRAGON_TRANSFORMATIONS.XY)
	SYMMETRY_TOGGLINGS.set(001, DRAGON_TRANSFORMATIONS.R)
	SYMMETRY_TOGGLINGS.set(111, DRAGON_TRANSFORMATIONS.XYR)
	SYMMETRY_TOGGLINGS.set(101, DRAGON_TRANSFORMATIONS.XYR)
	SYMMETRY_TOGGLINGS.set(011, DRAGON_TRANSFORMATIONS.XYR)

	const getXYR = getRGB

	const SYMMETRY_CIRCLE = {
		hasBorder: true,
		draw: (atom) => {
			CIRCLE.draw(atom)
			if (atom.value === undefined) return
			const [x, y, r] = getXYR(atom.value)
			if (x > 0) SYMMETRY_TOGGLE_X.drawX(atom)
			if (y > 0) SYMMETRY_TOGGLE_Y.drawY(atom)
			if (r > 0) SYMMETRY_TOGGLE_R.drawR(atom)
		},
		offscreen: CIRCLE.offscreen,
		overlaps: CIRCLE.overlaps,
		//behindChildren: true,
		expanded: false,
		borderColour: Colour.Grey,
		colour: Colour.Black,
		value: 000,
		click: (atom) => {
			
			if (atom.expanded) {
				atom.unexpand(atom)
			}

			else {

				atom.expand(atom)
			}
		},

		expand: (atom) => {
			atom.pad = createChild(atom, SYMMETRY_PAD)
			atom.handle = createChild(atom, SYMMETRY_HANDLE)
			atom.handle.width += OPTION_MARGIN
			atom.expanded = true

			const [x, y, r] = getXYR(atom.value)
			atom.xToggle = createChild(atom, SYMMETRY_TOGGLE_X)
			atom.yToggle = createChild(atom, SYMMETRY_TOGGLE_Y)
			atom.rToggle = createChild(atom, SYMMETRY_TOGGLE_R)

			if (x > 0) atom.xToggle.value = true
			if (y > 0) atom.yToggle.value = true
			if (r > 0) atom.rToggle.value = true
		},

		unexpand: (atom) => {
			deleteChild(atom, atom.pad)
			deleteChild(atom, atom.handle)
			deleteChild(atom, atom.xToggle)
			deleteChild(atom, atom.yToggle)
			deleteChild(atom, atom.rToggle)
			atom.expanded = false
		},
		
		size: COLOURTODE_SQUARE.size,
		update: (atom) => {
			
			const {x, y} = getAtomPosition(atom)

			const id = state.colourTode.atoms.indexOf(atom)
			const left = x
			const top = y
			const right = x + atom.width
			const bottom = y + atom.height

			if (hand.content === atom) for (const paddle of paddles) {
				const pid = state.colourTode.atoms.indexOf(paddle)
				const {x: px, y: py} = getAtomPosition(paddle)
				const pright = px + paddle.width
				const ptop = py
				const pbottom = py + paddle.height

				//if (paddle.pinhole.locked) continue

				if (!paddle.hasSymmetry && paddle.expanded && id > pid && left <= pright && right >= pright && ((top < pbottom && top > ptop) || (bottom > ptop && bottom < pbottom))) {
					if (atom.highlightPaddle !== undefined) {
						deleteChild(atom, atom.highlightPaddle)
					}

					atom.highlightPaddle = createChild(atom, HIGHLIGHT, {bottom: true})
					atom.highlightPaddle.width = HIGHLIGHT_THICKNESS
					atom.highlightPaddle.height = paddle.height
					atom.highlightPaddle.y = ptop
					atom.highlightPaddle.x = pright - HIGHLIGHT_THICKNESS/2
					atom.highlightedPaddle = paddle
					return
				}

			}

			if (atom.highlightPaddle !== undefined) {
				deleteChild(atom, atom.highlightPaddle)
				atom.highlightPaddle = undefined
				atom.highlightedPaddle = undefined
			}
		},
		drop: (atom) => {

			if (!atom.attached) {
				if (atom.highlightedPaddle !== undefined) {
					const paddle = atom.highlightedPaddle
					atom.attached = true
					giveChild(paddle, atom)
					
					paddle.hasSymmetry = true
					paddle.symmetryCircle = atom
					updatePaddleSize(paddle)

					atom.dx = 0
					atom.dy = 0
					
					/*atom.x = paddle.width -atom.width/2
					atom.y = paddle.height/2 - atom.height/2*/

					/*if (paddle.pinhole.locked && atom.expanded) {
						atom.unexpand(atom)
					}*/

				}
			}
			
		},

		drag: (atom) => {

			if (atom.attached) {
				const paddle = atom.parent

				/*if (paddle.pinhole.locked) {
					const clone = makeAtom(SYMMETRY_CIRCLE)
					clone.value = atom.value
					const {x, y} = getAtomPosition(atom)
					hand.offset.x -= atom.x - x
					hand.offset.y -= atom.y - y
					clone.x = x
					clone.y = y
					registerAtom(clone)
					return clone
				}*/

				atom.attached = false
				freeChild(paddle, atom)
				paddle.hasSymmetry = false
				paddle.symmetryCircle = undefined
				updatePaddleSize(paddle)
			}

			return atom
		},
	}

	const HIGHLIGHT_THICKNESS = BORDER_THICKNESS
	const HIGHLIGHT = {
		behindParent: true,
		draw: COLOURTODE_RECTANGLE.draw,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		draggable: false,
		grabbable: false,
		justVisual: true,
		colour: Colour.splash(999),
		borderColour: Colour.splash(999),
		hasAbsolutePosition: true,
		hasInner: false,
	}

	const TRIANGLE_PAD = {
		draw: COLOURTODE_RECTANGLE.draw,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		dragOnly: true,
		width: SYMMETRY_CIRCLE.size,
		x: SYMMETRY_CIRCLE.size*Math.sqrt(3)/2 + OPTION_MARGIN,
		height: (SYMMETRY_CIRCLE.size * 3) - OPTION_MARGIN,
		y: -(SYMMETRY_CIRCLE.size * 3)/3 + OPTION_MARGIN/2,
		colour: Colour.Grey,
		grab: (atom) => atom.parent,
	}

	const TRIANGLE_HANDLE = {
		draw: COLOURTODE_RECTANGLE.draw,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		dragOnly: true,
		width: SYMMETRY_CIRCLE.size/2 + OPTION_MARGIN,
		x: SYMMETRY_CIRCLE.size/2,
		height: SYMMETRY_CIRCLE.size / 3,
		y: SYMMETRY_CIRCLE.size/2 - (SYMMETRY_CIRCLE.size / 3)/2,
		colour: Colour.Grey,
		grab: (atom) => atom.parent,
	}

	const SYMMETRY_PAD = {
		draw: COLOURTODE_RECTANGLE.draw,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		dragOnly: true,
		width: SYMMETRY_CIRCLE.size,
		x: SYMMETRY_CIRCLE.size + OPTION_MARGIN,
		height: (SYMMETRY_CIRCLE.size * 3) - OPTION_MARGIN,
		y: -(SYMMETRY_CIRCLE.size * 3)/3 + OPTION_MARGIN/2,
		colour: Colour.Grey,
		grab: (atom) => atom.parent,
	}

	const SYMMETRY_HANDLE = {
		draw: COLOURTODE_RECTANGLE.draw,
		offscreen: COLOURTODE_RECTANGLE.offscreen,
		overlaps: COLOURTODE_RECTANGLE.overlaps,
		dragOnly: true,
		//touch: (atom) => atom.parent,
		width: SYMMETRY_CIRCLE.size/2,
		x: SYMMETRY_CIRCLE.size/2 + SYMMETRY_CIRCLE.size/4,
		height: SYMMETRY_CIRCLE.size / 3,
		y: SYMMETRY_CIRCLE.size/2 - (SYMMETRY_CIRCLE.size / 3)/2,
		colour: Colour.Grey,
		grab: (atom) => atom.parent,
	}

	const TRIANGLE_PICK_UP = {
		hasBorder: true,
		borderColour: Colour.Black,
		draw: (atom) => {
			atom.colour = atom.value? Colour.Silver : Colour.Black
			TRIANGLE_UP.draw(atom)
		},
		click: (atom) => {
			
			const triangle = atom.parent
			triangle.upPick.value = false
			triangle.rightPick.value = false
			triangle.downPick.value = false
			
			triangle.direction = "up"
			atom.value = true

		},
		offscreen: TRIANGLE_UP.offscreen,
		overlaps: TRIANGLE_UP.overlaps,
		
		value: false,
		size: COLOURTODE_SQUARE.size - OPTION_MARGIN*1.5,
		grab: (atom) => atom.parent,
		x: TRIANGLE_PAD.x + TRIANGLE_PAD.width/2 - (COLOURTODE_SQUARE.size - OPTION_MARGIN*1.5)/2,
		y: TRIANGLE_PAD.y + OPTION_MARGIN*1.5/2,
	}

	const TRIANGLE_PICK_RIGHT = {
		hasBorder: true,
		borderColour: Colour.Black,
		draw: (atom) => {
			atom.colour = atom.value? Colour.Silver : Colour.Black
			TRIANGLE_RIGHT.draw(atom)
		},
		offscreen: TRIANGLE_RIGHT.offscreen,
		overlaps: TRIANGLE_RIGHT.overlaps,
		
		value: false,
		size: COLOURTODE_SQUARE.size - OPTION_MARGIN*1.5,
		grab: (atom) => atom.parent,
		click: (atom) => {
			
			const triangle = atom.parent
			triangle.upPick.value = false
			triangle.rightPick.value = false
			triangle.downPick.value = false
			
			triangle.direction = "right"
			atom.value = true

		},
		x: TRIANGLE_PAD.x + TRIANGLE_PAD.width/2 - ((COLOURTODE_SQUARE.size - OPTION_MARGIN*1.5) * Math.sqrt(3)/2)/2,
		y: OPTION_MARGIN*1.5/2,
	}

	const TRIANGLE_PICK_DOWN = {
		hasBorder: true,
		borderColour: Colour.Black,
		draw: (atom) => {
			atom.colour = atom.value? Colour.Silver : Colour.Black
			TRIANGLE_DOWN.draw(atom)
		},
		click: (atom) => {
			
			const triangle = atom.parent
			triangle.upPick.value = false
			triangle.rightPick.value = false
			triangle.downPick.value = false
			
			triangle.direction = "down"
			atom.value = true

		},
		offscreen: TRIANGLE_DOWN.offscreen,
		overlaps: TRIANGLE_DOWN.overlaps,
		
		value: false,
		size: COLOURTODE_SQUARE.size - OPTION_MARGIN*1.5,
		grab: (atom) => atom.parent,
		x: TRIANGLE_PAD.x + TRIANGLE_PAD.width/2 - (COLOURTODE_SQUARE.size - OPTION_MARGIN*1.5)/2,
		y: TRIANGLE_PAD.y + TRIANGLE_PAD.height - (COLOURTODE_SQUARE.size - OPTION_MARGIN*1.5) - OPTION_MARGIN/2,
	}
	
	const SYMMETRY_TOGGLE_X = {
		hasBorder: true,
		borderColour: Colour.Black,
		colour: Colour.Grey,
		draw: (atom) => {
			atom.colour = atom.value? Colour.Silver : Colour.Grey
			CIRCLE.draw(atom)
			atom.drawX(atom)
		},
		drawX: (atom) => {
			const {x, y} = getAtomPosition(atom)

			const W = (atom.size)
			const H = (BORDER_THICKNESS*1.0)
			const X = (x)
			const Y = (y + atom.size/2 - BORDER_THICKNESS*1.0/2)

			colourTodeContext.fillStyle = atom.borderColour
			colourTodeContext.fillRect(X, Y, W, H)
		},
		offscreen: CIRCLE.offscreen,
		overlaps: CIRCLE.overlaps,
		expanded: false,
		click: (atom) => {
			atom.value = !atom.value
			let [x, y, r] = getXYR(atom.parent.value)
			x = atom.value? 100 : 0
			atom.parent.value = x+y+r
			const circle = atom.parent
			if (circle.parent !== COLOURTODE_BASE_PARENT) {
				const paddle = circle.parent
				updatePaddleRule(paddle)
			}
		},
		value: false,
		size: COLOURTODE_SQUARE.size - OPTION_MARGIN,
		grab: (atom) => atom.parent,
		x: SYMMETRY_PAD.x + SYMMETRY_PAD.width/2 - (COLOURTODE_SQUARE.size - OPTION_MARGIN)/2,
		y: SYMMETRY_PAD.y + OPTION_MARGIN/2,
	}
	
	const SYMMETRY_TOGGLE_Y = {
		hasBorder: true,
		borderColour: Colour.Black,
		colour: Colour.Grey,
		draw: (atom) => {
			atom.colour = atom.value? Colour.Silver : Colour.Grey
			CIRCLE.draw(atom)
			atom.drawY(atom)
		},
		drawY: (atom) => {
			const {x, y} = getAtomPosition(atom)

			const W = (BORDER_THICKNESS*1.0)
			const H = (atom.size)
			const X = (x + atom.size/2 - BORDER_THICKNESS*1.0/2)
			const Y = (y)

			colourTodeContext.fillStyle = atom.borderColour
			colourTodeContext.fillRect(X, Y, W, H)
		},
		offscreen: CIRCLE.offscreen,
		overlaps: CIRCLE.overlaps,
		expanded: false,
		click: (atom) => {
			atom.value = !atom.value
			let [x, y, r] = getXYR(atom.parent.value)
			y = atom.value? 10 : 0
			atom.parent.value = x+y+r
			const circle = atom.parent
			if (circle.parent !== COLOURTODE_BASE_PARENT) {
				const paddle = circle.parent
				updatePaddleRule(paddle)
			}
		},
		value: false,
		size: COLOURTODE_SQUARE.size - OPTION_MARGIN,
		grab: (atom) => atom.parent,
		x: SYMMETRY_PAD.x + SYMMETRY_PAD.width/2 - (COLOURTODE_SQUARE.size - OPTION_MARGIN)/2,
		y: OPTION_MARGIN/2,
	}
	
	const SYMMETRY_TOGGLE_R = {
		hasBorder: true,
		borderColour: Colour.Black,
		colour: Colour.Grey,
		draw: (atom) => {
			atom.colour = atom.value? Colour.Silver : Colour.Grey
			CIRCLE.draw(atom)
			atom.drawR(atom)
		},
		drawR: (atom) => {
			const {x, y} = getAtomPosition(atom)

			let X = (x + atom.size/2)
			let Y = (y + atom.size/2)
			let R = atom.size/2 - (BORDER_THICKNESS*1.5)*2

			colourTodeContext.fillStyle = atom.borderColour
			colourTodeContext.beginPath()
			colourTodeContext.arc(X, Y, R, 0, 2*Math.PI)
			colourTodeContext.fill()
			
			R -= BORDER_THICKNESS
			colourTodeContext.fillStyle = atom.colour
			colourTodeContext.beginPath()
			colourTodeContext.arc(X, Y, R, 0, 2*Math.PI)
			colourTodeContext.fill()
		},
		offscreen: CIRCLE.offscreen,
		overlaps: CIRCLE.overlaps,
		expanded: false,
		click: (atom) => {
			atom.value = !atom.value
			let [x, y, r] = getXYR(atom.parent.value)
			r = atom.value? 1 : 0
			atom.parent.value = x+y+r
			const circle = atom.parent
			if (circle.parent !== COLOURTODE_BASE_PARENT) {
				const paddle = circle.parent
				updatePaddleRule(paddle)
			}
		},
		value: false,
		size: COLOURTODE_SQUARE.size - OPTION_MARGIN,
		grab: (atom) => atom.parent,
		x: SYMMETRY_PAD.x + SYMMETRY_PAD.width/2 - (COLOURTODE_SQUARE.size - OPTION_MARGIN)/2,
		y: SYMMETRY_PAD.y + SYMMETRY_PAD.height - (COLOURTODE_SQUARE.size - OPTION_MARGIN) - OPTION_MARGIN/2,
	}

	//====================//
	// COLOURTODE - TOOLS //
	//====================//
	let menuRight = 10

	const COLOURTODE_TOOL = {
		element: COLOURTODE_SQUARE,
		draw: (atom) => {
			if ((atom.previousBrushColour !== state.brush.colour) || atom.toolbarNeedsColourUpdate) {
				atom.update(atom)
			}
			if (atom.unlocked) {
				atom.element.draw(atom)
			}
		},
		overlaps: (atom, x, y) => atom.element.overlaps(atom, x, y),
		grab: (atom, x, y) => {
			return atom
		},
		drag: (atom) => {
			const newAtom = makeAtom({...atom.element, x: atom.x, y: atom.y})
			registerAtom(newAtom)

			if (newAtom.value !== undefined) {
				if (newAtom.value.joins !== undefined) {
					for (const j of newAtom.value.joins) {
						const joinAtom = makeAtom(COLOURTODE_SQUARE)
						joinAtom.value = j
						newAtom.joins.push(joinAtom)
					}
				}
				newAtom.stamp = newAtom.value.stamp

			}
			
			if (newAtom.isSquare && !newAtom.value.isDiagram) {

				for (let i = 0; i < 3; i++) {
					const channel = newAtom.value.channels[i]
					if (channel === undefined) continue
					if (channel.variable === undefined) continue
					const diamond = makeAtom(COLOURTODE_TALL_RECTANGLE)
					newAtom.variableAtoms[i] = diamond
					diamond.expand(diamond)
					diamond.value = cloneDragonNumber(channel)
					diamond.variable = channel.variable
					diamond.makeOperationAtoms(diamond)
					diamond.unexpand(diamond)
				}

			}

			if (newAtom.value !== undefined && newAtom.value.isDiagram) {
				newAtom.update(newAtom)
			}

			return newAtom
		},
		cursor: () => "move",
	}

	let menuId = 0
	const addMenuTool = (element, unlockName) => {
		const {width = COLOURTODE_SQUARE.size, height = COLOURTODE_SQUARE.size, size} = element
		
		let y = COLOURTODE_PICKER_PAD_MARGIN
		if (height < COLOURTODE_SQUARE.size) {
			y += (COLOURTODE_SQUARE.size - height)/2
		}
		y += BORDER_THICKNESS

		const atom = makeAtom({...COLOURTODE_TOOL, width, height, size, x: Math.round(menuRight), y, element})
		atom.menuId = menuId
		menuId++
		atom.attached = true
		atom.isTool = true
		atom.previousBrushColour = undefined
		atom.colourId = 0
		atom.dcolourId = 1
		atom.colourTicker = Infinity
		atom.hasBorder = true
		menuRight += width
		menuRight += OPTION_MARGIN

		registerAtom(atom)

		if (unlockName === undefined) {
			atom.unlocked = true
		} else {
			atom.unlocked = false
			atom.grabbable = false
			unlocks[unlockName] = atom
			if (UNLOCK_MODE) unlockMenuTool(unlockName)
		}

		return atom
	}

	unlocks = {}
	const unlockMenuTool = (unlockName) => {
		const unlock = unlocks[unlockName]
		if (unlock.unlocked) return
		unlock.unlocked = true
		unlock.grabbable = true

		/*registerAtom(unlock)
		menuRight += unlock.width
		menuRight += OPTION_MARGIN*/

	}

	squareTool = addMenuTool(COLOURTODE_SQUARE)
	menuRight += BORDER_THICKNESS
	const triangleTool = addMenuTool(COLOURTODE_TRIANGLE, "triangle")
	//triangleTool.size -= BORDER_THICKNESS*1.5
	//triangleTool.y += BORDER_THICKNESS*1.5 / 2
	menuRight -= BORDER_THICKNESS
	const circleTool = addMenuTool(SYMMETRY_CIRCLE, "circle")
	const wideRectangleTool = addMenuTool(COLOURTODE_PICKER_CHANNEL, "wide_rectangle")
	//menuRight += BORDER_THICKNESS
	const tallRectangleTool = addMenuTool(COLOURTODE_TALL_RECTANGLE, "tall_rectangle")
	createPaddle()

	circleTool.borderScale = 1
	
	squareTool.update = (atom) => {

		if (atom.joinDrawId === undefined) {
			atom.joinDrawId = -1
			atom.joinDrawTimer = 0
		}

		if (typeof state.brush.colour === "number") {
			atom.value = makeArrayFromSplash(state.brush.colour)
		} else {
			const content = state.brush.colour.left[0].content
			atom.value = cloneDragonArray(content)
			if (atom === squareTool) {
				atom.stamp = atom.value.stamp
			}
		}

		if (atom.value !== undefined) {

			if (atom === squareTool) {
				if (atom.previousBrushColour !== state.brush.colour || atom.toolbarNeedsColourUpdate) {
					atom.previousBrushColour = state.brush.colour
					if (atom.multiAtoms === undefined) {
						atom.multiAtoms = []
					}
					for (const multiAtom of atom.multiAtoms) {
						deleteChild(atom, multiAtom)
					}

					atom.multiAtoms = []

					if (atom.value.isDiagram) {
						const diagram = atom.value
						const [diagramWidth, diagramHeight] = getDiagramDimensions(diagram)
						const cellAtomWidth = atom.width / diagramWidth
						const cellAtomHeight = atom.height / diagramHeight
						for (const diagramCell of diagram.left) {
							const multiAtom = createChild(atom, COLOURTODE_SQUARE)
							multiAtom.x = diagramCell.x * cellAtomWidth
							multiAtom.y = diagramCell.y * cellAtomHeight
							multiAtom.width = diagramCell.width * cellAtomWidth
							multiAtom.height = diagramCell.height * cellAtomHeight
							multiAtom.value = diagramCell.content
							multiAtom.update(multiAtom)
							atom.multiAtoms.push(multiAtom)
						}
					}
				}
			} else if (atom.value.isDiagram) {
				const diagram = atom.value
				const id = wrap(atom.menuId, 0, diagram.left.length-1)
				const diagramCell = diagram.left[id]
				atom.value = diagramCell.content
			}
		}

		const valueClone = cloneDragonArray(atom.value)
		atom.colours = getSplashesArrayFromArray(valueClone)

		if (atom.colourId >= atom.colours.length) {
			atom.colourId = 0
		}
		//atom.colour = Colour.splash(atom.colours[atom.colourId])
		if (atom.toolbarNeedsColourUpdate && atom === squareTool) {
			atom.toolbarNeedsColourUpdate = false
			atom.isGradient = true
			atom.gradient = getGradientImageFromColours({
				colours: atom.colours,
				width: atom.width * CT_SCALE,
				height: atom.height * CT_SCALE,
				gradient: atom.gradient,
				stamp: atom.value.stamp,
			})
		} else {
			atom.colour = Colour.splash(999)
			atom.borderColour = Colour.splash(999)
		}
	}

	triangleTool.update = squareTool.update
	circleTool.update = squareTool.update
	wideRectangleTool.update = squareTool.update
	tallRectangleTool.update = squareTool.update
	
})
