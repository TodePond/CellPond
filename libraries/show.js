const Show = {}

Show.start = ({tick = () => {}, speed = 1, paused = false, scale = 1.0, resize = () => {}} = {}) => {
	
	document.body.style["margin"] = "0px"
	document.body.style["overflow"] = "hidden"
	document.body.style["background-color"] = Colour.Void

	const canvas = document.createElement("canvas")
	const context = canvas.getContext("2d", {willReadFrequently: true})
	canvas.style["background-color"] = Colour.Void
	//canvas.style["image-rendering"] = "pixelated"
	document.body.appendChild(canvas)

	const pad = {}
	pad.canvas = document.createElement("canvas")
	pad.context = pad.canvas.getContext("2d")
	
	const show = {canvas, context, tick, speed, paused, scale, resize, pad}

	on.resize(() => {

		//pad.context.drawImage(canvas, 0, 0, canvas.width, canvas.height)

		canvas.width = innerWidth * show.scale
		canvas.height = innerHeight * show.scale
		canvas.style["width"] = innerWidth
		canvas.style["height"] = innerHeight
		
		// const margin = (100 - show.scale*100)/2
		// canvas.style["margin-top"] = `${margin}vh`
		// canvas.style["margin-bottom"] = `${margin}vh`
		// canvas.style["margin-left"] = `${margin}vw`
		// canvas.style["margin-right"] = `${margin}vw`
		
		show.resize()
		
		/*pad.canvas.width = canvas.width
		pad.canvas.height = canvas.height
		pad.canvas.style["width"] = canvas.style["width"]
		pad.canvas.style["height"] = canvas.style["height"]
		
		pad.canvas.style["margin-top"] = canvas.style["margin-top"]
		pad.canvas.style["margin-bottom"] = canvas.style["margin-bottom"]
		pad.canvas.style["margin-left"] = canvas.style["margin-left"]
		pad.canvas.style["margin-right"] = canvas.style["margin-right"]*/

	})
	
	trigger("resize")

	on.keydown(e => {
		if (e.key === " ") {
			if (!state.worldBuilt) return
			show.paused = !show.paused
			canvas.style["background-color"] = show.paused ? Colour.Black : Colour.Void
		}
	})
	
	const interval = 1000/60

	let t = 0
	let time = performance.now()
	const wrappedTick = () => {
		
		/*t += show.speed
		if (t < 1.0) return
		t = 0

		for (let i = 0; i < show.speed; i++) {
			show.tick()
		}*/
		show.tick()
	
		const now = performance.now()
		const interval = now - time
		//print(interval)
		time = now
		requestAnimationFrame(wrappedTick)
	}
	
	wrappedTick()
	
	
	return show
	
}