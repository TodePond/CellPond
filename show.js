const Show = {}

Show.start = ({interval = 1000 / 60, tick = () => {}, overload = 1, paused = false, scale = 1.0} = {}) => {
	
	document.body.style["margin"] = "0px"
	document.body.style["overflow"] = "hidden"
	document.body.style["background-color"] = Colour.Black

	const canvas = document.createElement("canvas")
	const context = canvas.getContext("2d")
	//canvas.style["background-color"] = Colour.Black
	document.body.appendChild(canvas)
	
	on.resize(() => {
		canvas.width = innerWidth * show.scale
		canvas.height = innerHeight * show.scale
		canvas.style["width"] = canvas.width
		canvas.style["height"] = canvas.height
		
		const margin = (100 - show.scale*100)/2
		canvas.style["margin-top"] = `${margin}vh`
		canvas.style["margin-bottom"] = `${margin}vh`
		canvas.style["margin-left"] = `${margin}vw`
		canvas.style["margin-right"] = `${margin}vw`

	})
	
	
	const show = {canvas, context, interval, tick, overload, paused, scale}
	trigger("resize")

	on.keydown(e => {
		if (e.key === " ") show.paused = !show.paused
	})
	
	let previousInterval = interval
	
	const wrappedTick = () => {
		
		// Interval changed
		if (show.interval !== previousInterval) {
			clearInterval(show.id)
			show.id = setInterval(wrappedTick, show.interval)
			previousTick = show.interval
		}
		
		for (let i = 0; i < show.overload; i++) {
			if (!show.paused) show.tick()
		}
		
	}
	
	show.id = setInterval(wrappedTick, interval)
	
	
	return show
	
}