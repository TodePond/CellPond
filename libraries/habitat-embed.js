const Habitat = {}

//=======//
// Array //
//=======//
{
	
	const install = (global) => {
	
		Reflect.defineProperty(global.Array.prototype, "last", {
			get() {
				return this[this.length-1]
			},
			set(value) {
				Reflect.defineProperty(this, "last", {value, configurable: true, writable: true, enumerable: true})
			},
			configurable: true,
			enumerable: false,
		})
		
		Reflect.defineProperty(global.Array.prototype, "clone", {
			get() {
				return [...this]
			},
			set(value) {
				Reflect.defineProperty(this, "clone", {value, configurable: true, writable: true, enumerable: true})
			},
			configurable: true,
			enumerable: false,
		})
		
		Reflect.defineProperty(global.Array.prototype, "at", {
			value(position) {
				if (position >= 0) return this[position]
				return this[this.length + position]
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.Array.prototype, "shuffle", {
			value() {
				for (let i = this.length - 1; i > 0; i--) {
					const r = Math.floor(Math.random() * (i+1))
					;[this[i], this[r]] = [this[r], this[i]]
				}
				return this
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.Array.prototype, "trim", {
			value() {
				if (this.length == 0) return this
				let start = this.length - 1
				let end = 0
				for (let i = 0; i < this.length; i++) {
					const value = this[i]
					if (value !== undefined) {
						start = i
						break
					}
				}
				for (let i = this.length - 1; i >= 0; i--) {
					const value = this[i]
					if (value !== undefined) {
						end = i + 1
						break
					}
				}
				this.splice(end)
				this.splice(0, start)
				return this
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.Array.prototype, "repeat", {
			value(n) {
				if (n === 0) {
					this.splice(0)
					return this
				}
				if (n < 0) {
					this.reverse()
					n = n - n - n 
				}
				const clone = [...this]
				for (let i = 1; i < n; i++) {
					this.push(...clone)
				}
				return this
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Habitat.Array.installed = true
		
	}
	
	Habitat.Array = {install}
	
}

//=======//
// Async //
//=======//
{
	const sleep = (duration) => new Promise(resolve => setTimeout(resolve, duration))
	const install = (global) => {
		global.sleep = sleep
		Habitat.Async.installed = true
	}
	
	Habitat.Async = {install, sleep}
}

//========//
// Colour //
//========//
{
	
	Habitat.Colour = {}
	
	Habitat.Colour.make = (style) => {

		if (typeof style === "number") {
			let string = style.toString()
			while (string.length < 3) string = "0"+string
			
			const redId = parseInt(string[0])
			const greenId = parseInt(string[1])
			const blueId = parseInt(string[2])

			const red = reds[redId]
			const green = greens[greenId]
			const blue = blues[blueId]

			const rgb = `rgb(${red}, ${green}, ${blue})`

			const colour = Habitat.Colour.make(rgb)
			colour.splash = style
			return colour
		}

		const canvas = document.createElement("canvas")
		const context = canvas.getContext("2d")
		canvas.width = 1
		canvas.height = 1
		context.fillStyle = style
		context.fillRect(0, 0, 1, 1)

		const data = context.getImageData(0, 0, 1, 1).data
		const [red, green, blue] = data
		const splash = getSplash(red, green, blue)
		const alpha = data[3] / 255
		const [hue, saturation, lightness] = getHSL(red, green, blue)
		const colour = new Uint8Array([red, green, blue, alpha])
		colour.fullColour = true
		
		colour.red = red
		colour.green = green
		colour.blue = blue
		colour.alpha = alpha

		colour.splash = splash

		colour.hue = hue
		colour.saturation = saturation
		colour.lightness = lightness

		colour.r = red
		colour.g = green
		colour.b = blue
		colour.a = alpha

		const rgb = `rgb(${red}, ${green}, ${blue})`
		const rgba = `rgba(${red}, ${green}, ${blue}, ${alpha})`
		const hex = `#${hexify(red)}${hexify(green)}${hexify(blue)}`
		const hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`

		colour.toString = () => hex
		colour.rgb = rgb
		colour.rgba = rgba
		colour.hex = hex
		colour.hsl = hsl

		colour.brightness = (red*299 + green*587 + blue*114) / 1000 / 255
		colour.isBright = colour.brightness > 0.7
		colour.isDark = colour.brightness < 0.3

		return colour
	}

	const hexify = (number) => {
		const string = number.toString(16)
		if (string.length === 2) return string
		return "0"+string
	}

	const getSplash = (red, green, blue) => {
		const closestRed = getClosest(red, reds).toString()
		const closestGreen = getClosest(green, greens).toString()
		const closestBlue = getClosest(blue, blues).toString()
		const string = closestRed + closestGreen + closestBlue
		const splash = parseInt(string)
		return splash
	}

	const getClosest = (number, array) => {
		let highscore = Infinity
		let winner = 0
		for (let i = 0; i < array.length; i++) {
			const value = array[i]
			const difference = Math.abs(number - value)
			if (difference < highscore) {
				highscore = difference
				winner = i
			}
		}
		return winner
	}

	//https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
	const getHSL = (red, green, blue) => {

		red /= 255
		green /= 255
		blue /= 255

		const max = Math.max(red, green, blue)
		const min = Math.min(red, green, blue)
		const chroma = max - min

		let lightness = (max + min) / 2
		let saturation = 0
		if (lightness !== 0 && lightness !== 1) {
			saturation = (max - lightness) / Math.min(lightness, 1-lightness)
		}
		
		let hue = 0
		if (max === red) hue = (green-blue)/chroma
		if (max === green) hue = 2 + (blue-red)/chroma
		if (max === blue) hue = 4 + (red-green)/chroma
		if (chroma === 0) hue = 0

		lightness *= 100
		saturation *= 100
		hue *= 60
		while (hue < 0) hue += 360

		return [hue, saturation, lightness]

	}
	
	Habitat.Colour.add = (colour, {red=0, green=0, blue=0, alpha=0, hue=0, saturation=0, lightness=0, r=0, g=0, b=0, a=0, h=0, s=0, l=0, splash, fullColour = false} = {}) => {
		
		const newRed = clamp(colour.red + r + red, 0, 255)
		const newGreen = clamp(colour.green + g + green, 0, 255)
		const newBlue = clamp(colour.blue + b + blue, 0, 255)
		const newAlpha = clamp(colour.alpha + a + alpha, 0, 1)
		const rgbaStyle = `rgba(${newRed}, ${newGreen}, ${newBlue}, ${newAlpha})`
		const rgbaColour = Habitat.Colour.make(rgbaStyle)

		if (fullColour) return rgbaColour

		const newHue = wrap(rgbaColour.hue + h + hue, 0, 360)
		const newSaturation = clamp(rgbaColour.saturation + s + saturation, 0, 100)
		const newLightness = clamp(rgbaColour.lightness + l + lightness, 0, 100)
		const hslStyle = `hsl(${newHue}, ${newSaturation}%, ${newLightness}%)`
		const hslColour = Habitat.Colour.make(hslStyle)

		if (splash !== undefined && splashed) {
			const newSplash = hslColour.splash + splash
			const splashColour = Habitat.Colour.make(newSplash)
			return splashColour
		}

		return hslColour

	}
	
	
	Habitat.Colour.multiply = (colour, {red=1, green=1, blue=1, alpha=1, hue=1, saturation=1, lightness=1, r=1, g=1, b=1, a=1, h=1, s=1, l=1, splash, fullColour = false} = {}) => {
		
		const newRed = clamp(colour.red * r * red, 0, 255)
		const newGreen = clamp(colour.green * g * green, 0, 255)
		const newBlue = clamp(colour.blue * b * blue, 0, 255)
		const newAlpha = clamp(colour.alpha * a * alpha, 0, 1)
		const rgbaStyle = `rgba(${newRed}, ${newGreen}, ${newBlue}, ${newAlpha})`
		const rgbaColour = Habitat.Colour.make(rgbaStyle)

		if (fullColour) return rgbaColour

		const newHue = wrap(rgbaColour.hue * h * hue, 0, 360)
		const newSaturation = clamp(rgbaColour.saturation * s * saturation, 0, 100)
		const newLightness = clamp(rgbaColour.lightness * l * lightness, 0, 100)
		const hslStyle = `hsl(${newHue}, ${newSaturation}%, ${newLightness}%)`
		const hslColour = Habitat.Colour.make(hslStyle)

		if (splash !== undefined) {
			const newSplash = hslColour.splash * splash
			const splashColour = Habitat.Colour.make(newSplash)
			return splashColour
		}

		return hslColour

	}

	const clamp = (number, min, max) => {
		if (number < min) return min
		if (number > max) return max
		return number
	}

	const wrap = (number, min, max) => {
		const difference = max - min
		while (number < min) number += difference
		while (number > max) number -= difference
		return number
	}
	
	const reds   = [23, 55, 70,  98, 128, 159, 174, 204, 242, 255]
	const greens = [29, 67, 98, 128, 159, 174, 204, 222, 245, 255]
	const blues  = [40, 70, 98, 128, 159, 174, 204, 222, 247, 255]
	
	Habitat.Colour.Void = Habitat.Colour.make("rgb(6, 7, 10)")
	Habitat.Colour.Black = Habitat.Colour.make(000)
	Habitat.Colour.Grey = Habitat.Colour.make(112)
	Habitat.Colour.Silver = Habitat.Colour.make(556)
	Habitat.Colour.White = Habitat.Colour.make(888)

	Habitat.Colour.Green = Habitat.Colour.make(293)
	Habitat.Colour.Red = Habitat.Colour.make(911)
	Habitat.Colour.Blue = Habitat.Colour.make(239)
	Habitat.Colour.Yellow = Habitat.Colour.make(961)
	Habitat.Colour.Orange = Habitat.Colour.make(931)
	Habitat.Colour.Pink = Habitat.Colour.make(933)
	Habitat.Colour.Rose = Habitat.Colour.make(936)
	Habitat.Colour.Cyan = Habitat.Colour.make(269)
	Habitat.Colour.Purple = Habitat.Colour.make(418)

	Habitat.Colour.cache = []
	Habitat.Colour.splash = (number) => {
		if (Habitat.Colour.cache.length === 0) {
			for (let i = 0; i < 1000; i++) {
				const colour = Habitat.Colour.make(i)
				Habitat.Colour.cache.push(colour)
			}
		}

		return Habitat.Colour.cache[number]
	}

	Habitat.Colour.install = (global) => {
		global.Colour = Habitat.Colour
		Habitat.Colour.installed = true
	}
	
}

//=========//
// Console //
//=========//
{
	const print = console.log.bind(console)
	const dir = (value) => console.dir(Object(value))
	
	let print9Counter = 0
	const print9 = (message) => {
		if (print9Counter >= 9) return
		print9Counter++
		console.log(message)
	}
	
	const install = (global) => {
		global.print = print
		global.dir = dir
		global.print9 = print9
		
		Reflect.defineProperty(global.Object.prototype, "d", {
			get() {
				const value = this.valueOf()
				console.log(value)
				return value
			},
			set(value) {
				Reflect.defineProperty(this, "d", {value, configurable: true, writable: true, enumerable: true})
			},
			configurable: true,
			enumerable: false,
		})
		
		Reflect.defineProperty(global.Object.prototype, "dir", {
			get() {
				console.dir(this)
				return this.valueOf()
			},
			set(value) {
				Reflect.defineProperty(this, "dir", {value, configurable: true, writable: true, enumerable: true})
			},
			configurable: true,
			enumerable: false,
		})
		
		let d9Counter = 0
		Reflect.defineProperty(global.Object.prototype, "d9", {
			get() {
				const value = this.valueOf()
				if (d9Counter < 9) {
					console.log(value)
					d9Counter++
				}
				return value
			},
			set(value) {
				Reflect.defineProperty(this, "d9", {value, configurable: true, writable: true, enumerable: true})
			},
			configurable: true,
			enumerable: false,
		})
		
		Habitat.Console.installed = true
		
	}
	
	Habitat.Console = {install, print, dir, print9}
}

//==========//
// Document //
//==========//
{

	const $ = (...args) => document.querySelector(...args)
	const $$ = (...args) => document.querySelectorAll(...args)

	const install = (global) => {
	
	
		global.$ = $
		global.$$ = $$
		
		if (global.Node === undefined) return
		
		Reflect.defineProperty(global.Node.prototype, "$", {
			value(...args) {
				return this.querySelector(...args)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.Node.prototype, "$$", {
			value(...args) {
				return this.querySelectorAll(...args)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Habitat.Document.installed = true
		
	}
	
	Habitat.Document = {install, $, $$}
	
}


//=======//
// Event //
//=======//
{

	const install = (global) => {
	
		Reflect.defineProperty(global.EventTarget.prototype, "on", {
			get() {
				return new Proxy(this, {
					get: (element, eventName) => (...args) => element.addEventListener(eventName, ...args),
				})
			},
			set(value) {
				Reflect.defineProperty(this, "on", {value, configurable: true, writable: true, enumerable: true})
			},
			configurable: true,
			enumerable: false,
		})
		
		Reflect.defineProperty(global.EventTarget.prototype, "trigger", {
			value(name, options = {}) {
				const {bubbles = true, cancelable = true, ...data} = options
				const event = new Event(name, {bubbles, cancelable})
				for (const key in data) event[key] = data[key]
				this.dispatchEvent(event)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Habitat.Event.installed = true
		
	}
	
	Habitat.Event = {install}
	
}


//======//
// HTML //
//======//
{

	Habitat.HTML = (...args) => {
		const source = String.raw(...args)
		const template = document.createElement("template")
		template.innerHTML = source
		return template.content
	}

	Habitat.HTML.install = (global) => {
		global.HTML = Habitat.HTML
		Habitat.HTML.installed = true
	}
	
}


//============//
// JavaScript //
//============//
{
	
	Habitat.JavaScript = (...args) => {
		const source = String.raw(...args)
		const code = `return ${source}`
		const func = new Function(code)()
		return func
	}
	
	Habitat.JavaScript.install = (global) => {
		global.JavaScript = Habitat.JavaScript	
		Habitat.JavaScript.installed = true
	}
	
}


//==========//
// Keyboard //
//==========//
{

	const Keyboard = Habitat.Keyboard = {}
	Reflect.defineProperty(Keyboard, "install", {
		value(global) {
			global.Keyboard = Keyboard
			global.addEventListener("keydown", e => {
				Keyboard[e.key] = true
			})
			
			global.addEventListener("keyup", e => {
				Keyboard[e.key] = false
			})
			
			Reflect.defineProperty(Keyboard, "installed", {
				value: true,
				configurable: true,
				enumerable: false,
				writable: true,
			})
		},
		configurable: true,
		enumerable: false,
		writable: true,
	})
	
}


//======//
// Main //
//======//
Habitat.install = (global) => {

	if (Habitat.installed) return

	if (!Habitat.Array.installed)      Habitat.Array.install(global)
	if (!Habitat.Async.installed)      Habitat.Async.install(global)
	if (!Habitat.Colour.installed)     Habitat.Colour.install(global)
	if (!Habitat.Console.installed)    Habitat.Console.install(global)
	if (!Habitat.Document.installed)   Habitat.Document.install(global)
	if (!Habitat.Event.installed)      Habitat.Event.install(global)
	if (!Habitat.HTML.installed)       Habitat.HTML.install(global)
	if (!Habitat.JavaScript.installed) Habitat.JavaScript.install(global)
	if (!Habitat.Keyboard.installed)   Habitat.Keyboard.install(global)
	if (!Habitat.Math.installed)       Habitat.Math.install(global)
	if (!Habitat.Mouse.installed)      Habitat.Mouse.install(global)
	if (!Habitat.Number.installed)     Habitat.Number.install(global)
	if (!Habitat.Object.installed)     Habitat.Object.install(global)
	if (!Habitat.Property.installed)   Habitat.Property.install(global)
	if (!Habitat.Random.installed)     Habitat.Random.install(global)
	if (!Habitat.Stage.installed)      Habitat.Stage.install(global)
	if (!Habitat.String.installed)     Habitat.String.install(global)
	if (!Habitat.Touches.installed)    Habitat.Touches.install(global)
	if (!Habitat.Tween.installed)      Habitat.Tween.install(global)
	if (!Habitat.Type.installed)       Habitat.Type.install(global)
	
	Habitat.installed = true
	
}

//======//
// Math //
//======//
{
	
	const gcd = (...numbers) => {
		const [head, ...tail] = numbers
		if (numbers.length === 1) return head
		if (numbers.length  >  2) return gcd(head, gcd(...tail))
		
		let [a, b] = [head, ...tail]
		
		while (true) {
			if (b === 0) return a
			a = a % b
			if (a === 0) return b
			b = b % a
		}
		
	}
	
	const reduce = (...numbers) => {
		const divisor = gcd(...numbers)
		return numbers.map(n => n / divisor)
	}

	const wrap = (number, min, max) => {
		const difference = max - min
		while (number > max) {
			number -= difference
		}
		while (number < min) {
			number += difference
		}
		return number
	}
	
	const install = (global) => {
		global.Math.gcd = Habitat.Math.gcd
		global.Math.reduce = Habitat.Math.reduce
		global.Math.wrap = Habitat.Math.wrap
		Habitat.Math.installed = true
	}
	
	
	Habitat.Math = {install, gcd, reduce, wrap}
	
}


//=======//
// Mouse //
//=======//
{

	const Mouse = Habitat.Mouse = {
		position: [undefined, undefined],
	}
	
	const buttonMap = ["Left", "Middle", "Right", "Back", "Forward"]
	
	Reflect.defineProperty(Mouse, "install", {
		value(global) {
			global.Mouse = Mouse
			global.addEventListener("mousedown", e => {
				const buttonName = buttonMap[e.button]
				Mouse[buttonName] = true
			})
			
			global.addEventListener("mouseup", e => {
				const buttonName = buttonMap[e.button]
				Mouse[buttonName] = false
			})
			
			global.addEventListener("mousemove", e => {
				Mouse.position[0] = event.clientX
				Mouse.position[1] = event.clientY
			})
			
			Reflect.defineProperty(Mouse, "installed", {
				value: true,
				configurable: true,
				enumerable: false,
				writable: true,
			})
		},
		configurable: true,
		enumerable: false,
		writable: true,
	})
	
}


//========//
// Number //
//========//
{
	
	const install = (global) => {
		
		Reflect.defineProperty(global.Number.prototype, "to", {
			value: function* (v) {
				let i = this.valueOf()
				if (i <= v) {
					while (i <= v) {
						yield i
						i++
					}
				}
				else {
					while (i >= v) {
						yield i
						i--
					}
				}
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		const numberToString = global.Number.prototype.toString
		Reflect.defineProperty(global.Number.prototype, "toString", {
			value(base, size) {
				if (size === undefined) return numberToString.call(this, base)
				if (size <= 0) return ""
				const string = numberToString.call(this, base)
				return string.slice(-size).padStart(size, "0")
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		if (global.BigInt !== undefined) {
			const bigIntToString = global.BigInt.prototype.toString
			Reflect.defineProperty(global.BigInt.prototype, "toString", {
				value(base, size) {
					if (size === undefined) return bigIntToString.call(this, base)
					if (size <= 0) return ""
					const string = bigIntToString.call(this, base)
					return string.slice(-size).padStart(size, "0")
				},
				configurable: true,
				enumerable: false,
				writable: true,
			})
		}
		
		Habitat.Number.installed = true
		
	}
	
	Habitat.Number = {install}
	
}

//========//
// Object //
//========//
{
	Habitat.Object = {}
	Habitat.Object.install = (global) => {
		
		Reflect.defineProperty(global.Object.prototype, Symbol.iterator, {
			value: function*() {
				for (const key in this) {
					yield this[key]
				}
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.Object.prototype, "keys", {
			value() {
				return Object.keys(this)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.Object.prototype, "values", {
			value() {
				return Object.values(this)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.Object.prototype, "entries", {
			value() {
				return Object.entries(this)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Habitat.Object.installed = true
		
	}
	
}

//==========//
// Property //
//==========//
{
	
	const install = (global) => {
	
		Reflect.defineProperty(global.Object.prototype, "_", {
			get() {
				return new Proxy(this, {
					set(object, propertyName, descriptor) {
						Reflect.defineProperty(object, propertyName, descriptor)
					},
					get(object, propertyName) {
						const editor = {
							get value() {
								const descriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {}
								const {value} = descriptor
								return value
							},
							set value(value) {
								const {enumerable, configurable, writable} = Reflect.getOwnPropertyDescriptor(object, propertyName) || {enumerable: true, configurable: true, writable: true}
								const descriptor = {value, enumerable, configurable, writable}
								Reflect.defineProperty(object, propertyName, descriptor)
							},
							get get() {
								const descriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {}
								const {get} = descriptor
								return get
							},
							set get(get) {
								const {set, enumerable, configurable} = Reflect.getOwnPropertyDescriptor(object, propertyName) || {enumerable: true, configurable: true}
								const descriptor = {get, set, enumerable, configurable}
								Reflect.defineProperty(object, propertyName, descriptor)
							},
							get set() {
								const descriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {}
								const {set} = descriptor
								return set
							},
							set set(set) {
								const {get, enumerable, configurable} = Reflect.getOwnPropertyDescriptor(object, propertyName) || {enumerable: true, configurable: true}
								const descriptor = {get, set, enumerable, configurable}
								Reflect.defineProperty(object, propertyName, descriptor)
							},
							get enumerable() {
								const descriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {}
								const {enumerable} = descriptor
								return enumerable
							},
							set enumerable(v) {
								const descriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {configurable: true, writable: true}
								descriptor.enumerable = v
								Reflect.defineProperty(object, propertyName, descriptor)
							},
							get configurable() {
								const descriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {}
								const {configurable} = descriptor
								return configurable
							},
							set configurable(v) {
								const descriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {enumerable: true, writable: true}
								descriptor.configurable = v
								Reflect.defineProperty(object, propertyName, descriptor)
							},
							get writable() {
								const descriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {}
								const {writable} = descriptor
								return writable
							},
							set writable(v) {
								const oldDescriptor = Reflect.getOwnPropertyDescriptor(object, propertyName) || {enumerable: true, configurable: true}
								const {get, set, writable, ...rest} = oldDescriptor
								const newDescriptor = {...rest, writable: v}
								Reflect.defineProperty(object, propertyName, newDescriptor)
							},
						}
						return editor
					},
				})
			},
			set(value) {
				Reflect.defineProperty(this, "_", {value, configurable: true, writable: true, enumerable: true})
			},
			configurable: true,
			enumerable: false,
		})
		
		
		Habitat.Property.installed = true
		
	}
	
	Habitat.Property = {install}
	
}

//========//
// Random //
//========//
{
	Habitat.Random = {}
	
	const maxId8 = 2 ** 16
	const u8s = new Uint8Array(maxId8)
	let id8 = maxId8
	const getRandomUint8 = () => {
		
		if (id8 >= maxId8) {
			crypto.getRandomValues(u8s)
			id8 = 0
		}
		
		const result = u8s[id8]
		id8++
		return result
	}
	
	Reflect.defineProperty(Habitat.Random, "Uint8", {
		get: getRandomUint8,
		configurable: true,
		enumerable: true,
	})
	
	const maxId32 = 2 ** 14
	const u32s = new Uint32Array(maxId32)
	let id32 = maxId32
	const getRandomUint32 = () => {
		
		if (id32 >= maxId32) {
			crypto.getRandomValues(u32s)
			id32 = 0
		}
		
		const result = u32s[id32]
		id32++
		return result
	}
	
	Reflect.defineProperty(Habitat.Random, "Uint32", {
		get: getRandomUint32,
		configurable: true,
		enumerable: true,
	})
	
	Habitat.Random.oneIn = (n) => {
		const result = getRandomUint32()
		return result % n === 0
	}
	
	Habitat.Random.maybe = (chance) => {
		return Habitat.Random.oneIn(1 / chance)
	}
	
	Habitat.Random.install = (global) => {
		global.Random = Habitat.Random
		global.oneIn = Habitat.Random.oneIn
		global.maybe = Habitat.Random.maybe
		Habitat.Random.installed = true
	}
	
}

//=======//
// Stage //
//=======//
{
	
	Habitat.Stage = {}
	Habitat.Stage.make = () => {
		
		const canvas = document.createElement("canvas")
		const context = canvas.getContext("2d")
		
		const stage = {
			canvas,
			context,
			update: () => {},
			draw: () => {},
			tick: () => {
				stage.update()
				stage.draw()
				requestAnimationFrame(stage.tick)
			},
		}
		
		requestAnimationFrame(stage.tick)
		return stage
	}
	
	Habitat.Stage.install = (global) => {
		global.Stage = Habitat.Stage
		Habitat.Stage.installed = true
		
	}
	
}

//========//
// String //
//========//
{
	
	const install = (global) => {
		
		Reflect.defineProperty(global.String.prototype, "divide", {
			value(n) {
				const regExp = RegExp(`[^]{1,${n}}`, "g")
				return this.match(regExp)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.String.prototype, "toNumber", {
			value(base) {
				return parseInt(this, base)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Habitat.String.installed = true
		
	}
	
	Habitat.String = {install}
	
}

//=======//
// Touch //
//=======//
{

	const Touches = Habitat.Touches = []
	
	const trim = (a) => {
		if (a.length == 0) return a
		let start = a.length - 1
		let end = 0
		for (let i = 0; i < a.length; i++) {
			const value = a[i]
			if (value !== undefined) {
				start = i
				break
			}
		}
		for (let i = a.length - 1; i >= 0; i--) {
			const value = a[i]
			if (value !== undefined) {
				end = i + 1
				break
			}
		}
		a.splice(end)
		a.splice(0, start)
		return a
	}
	
	Reflect.defineProperty(Touches, "install", {
		value(global) {
			
			global.Touches = Touches
			global.addEventListener("touchstart", e => {
				for (const changedTouch of e.changedTouches) {
					const x = changedTouch.clientX
					const y = changedTouch.clientY
					const id = changedTouch.identifier
					if (Touches[id] === undefined) Touches[id] = {position: [undefined, undefined]}
					const touch = Touches[id]
					touch.position[0] = x
					touch.position[1] = y
				}
			})
			
			global.addEventListener("touchmove", e => {
				try {
					for (const changedTouch of e.changedTouches) {
						const x = changedTouch.clientX
						const y = changedTouch.clientY
						const id = changedTouch.identifier
						let touch = Touches[id]
						if (touch == undefined) {
							touch = {position: [undefined, undefined]}
							Touches[id] = touch
						}
						
						touch.position[0] = x
						touch.position[1] = y
					}
				}
				catch(e) {
					console.error(e)
				}
			})
			
			global.addEventListener("touchend", e => {
				for (const changedTouch of e.changedTouches) {
					const id = changedTouch.identifier
					Touches[id] = undefined
				}
				trim(Touches)
			})
			
			Reflect.defineProperty(Touches, "installed", {
				value: true,
				configurable: true,
				enumerable: false,
				writable: true,
			})
		},
		configurable: true,
		enumerable: false,
		writable: true,
	})
	
	
}


//=======//
// Tween //
//=======//

{
	Habitat.Tween = {}
	
	// all from https://easings.net
	Habitat.Tween.EASE_IN_LINEAR = (t) => t
	Habitat.Tween.EASE_OUT_LINEAR = (t) => t
	Habitat.Tween.EASE_IN_OUT_LINEAR = (t) => t
	Habitat.Tween.EASE_IN_SINE = (t) => 1-Math.cos(t*Math.PI/2)
	Habitat.Tween.EASE_OUT_SINE = (t) => Math.sin(t*Math.PI/2)
	Habitat.Tween.EASE_IN_OUT_SINE = (t) => -(Math.cos(t*Math.PI)-1)/2
	Habitat.Tween.EASE_IN_POWER = (p) => (t) => Math.pow(t, p)
	Habitat.Tween.EASE_OUT_POWER = (p) => (t) => 1-Math.pow(1-t, p)
	Habitat.Tween.EASE_IN_OUT_POWER = (p) => (t) => {
		if (t < 0.5) return Math.pow(2, p-1)*Math.pow(t, p)
		return 1 - Math.pow(2 - 2*t, p)/2
	}
	Habitat.Tween.EASE_IN_EXP = Habitat.Tween.EASE_IN_EXPONENTIAL = (e) => (t) => Math.pow(2, e*t - e) * t
	Habitat.Tween.EASE_OUT_EXP = Habitat.Tween.EASE_OUT_EXPONENTIAL = (e) => (t) => 1 - Math.pow(2, -e*t) * (1-t)
	Habitat.Tween.EASE_IN_OUT_EXP = Habitat.Tween.EASE_IN_OUT_EXPONENTIAL = (e) => (t) => {
		let f;
		if (t < 0.5) f = t => Math.pow(2, 2*e*t - e)/2
		else f = t => (2 - Math.pow(2, -2*e*t + e))/2
		return f(t) * ((1-t)*f(0) + t*(f(1)-1))
	}
	Habitat.Tween.EASE_IN_CIRCULAR = (t) => 1 - Math.sqrt(1 - Math.pow(t, 2))
	Habitat.Tween.EASE_OUT_CIRCULAR = (t) => Math.sqrt(1 - Math.pow(t - 1, 2))
	Habitat.Tween.EASE_IN_OUT_CIRCULAR = (t) => {
		if (t < 0.5) return 0.5 - Math.sqrt(1 - Math.pow(2*t, 2))/2
		return 0.5 + Math.sqrt(1 - Math.pow(-2*t + 2, 2))/2
	}
	Habitat.Tween.EASE_IN_BACK = (t) => 2.70158*t*t*t - 1.70158*t*t
	Habitat.Tween.EASE_OUT_BACK = (t) => 1 + 2.70158*Math.pow(t - 1, 3) + 1.70158*Math.pow(t - 1, 2)
	Habitat.Tween.EASE_IN_OUT_BACK = (t) => {
		if (t < 0.5) return (Math.pow(2*t, 2)*(3.59491*2*t - 2.59491))/2
		return (Math.pow(2*t-2,2)*(3.59491*(t*2-2) + 2.59491)+2)/2
	}
	Habitat.Tween.EASE_IN_ELASTIC = (t) => -Math.pow(2,10*t-10)*Math.sin((t*10-10.75)*2*Math.PI/3)
	Habitat.Tween.EASE_OUT_ELASTIC = (t) => Math.pow(2,-10*t)*Math.sin((t*10-0.75)*2*Math.PI/3)+1
	Habitat.Tween.EASE_IN_OUT_ELASTIC = (t) => {
		if (t < 0.5) return -(Math.pow(2, 20*t-10)*Math.sin((20*t-11.125)*2*Math.PI/4.5))/2
		return (Math.pow(2, -20*t+10)*Math.sin((20*t-11.125)*2*Math.PI/4.5))/2+1
	}
	Habitat.Tween.EASE_OUT_BOUNCE = (t) => (t) => {
		const n1 = 7.5625
		const d1 = 2.75

		if      (t < 1 / d1)   return n1 * t * t
		else if (t < 2 / d1)   return n1 * (t -= 1.5 / d1) * t + 0.75
		else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
		else                   return n1 * (t -= 2.625 / d1) * t + 0.984375
	}
	Habitat.Tween.EASE_IN_BOUNCE = (t) => 1-Habitat.Tween.EASE_OUT_BOUNCE(1-t)
	Habitat.Tween.EASE_IN_OUT_BOUNCE = (t) => {
		if (t < 0.5) return (1-Habitat.Tween.EASE_OUT_BOUNCE(1-2*t))/2
		return (1+Habitat.Tween.EASE_OUT_BOUNCE(2*t-1))/2
	}

	Habitat.Tween.install = (global) => {
		Habitat.Tween.installed = true

		Reflect.defineProperty(global.Object.prototype, "tween", {
			value(propertyName, {to, from, over = 1000, launch = 0.5, land = 0.5, strength = 1, ease = false} = {}) {
				const before = this[propertyName]
				if (from === undefined) from = before
				if (to === undefined) to = before

				launch *= 2/3
				land = 1/3 + (1 - land) * 2/3

				const start = performance.now()

				Reflect.defineProperty(this, propertyName, {
					get() {
						const now = performance.now()

						if (now > start + over) {
							Reflect.defineProperty(this, propertyName, {
								value: to,
								writable: true,
								configurable: true,
								enumerable: true
							})
							return to
						}

						const t = (now - start) / over

						if (ease) {
							const v = ease(strength)
							if (typeof v == 'function') return v(t) * (to - from) + from
							return ease(t) * (to - from) + from
						}

						const v = 3*t*(1-t)*(1-t)*launch + 3*t*t*(1-t)*land + t*t*t
						return v * (to - from) + from

					},
					set() { },

					configurable: true,
					enumerable: true
				})
			},
			
			configurable: true,
			enumerable: false,
			writable: true
		})
	}
}


//======//
// Type //
//======//
{

	const Int = {
		check: (n) => n % 1 == 0,
		convert: (n) => parseInt(n),
	}

	const Positive = {
		check: (n) => n >= 0,
		convert: (n) => Math.abs(n),
	}

	const Negative = {
		check: (n) => n <= 0,
		convert: (n) => -Math.abs(n),
	}

	const UInt = {
		check: (n) => n % 1 == 0 && n >= 0,
		convert: (n) => Math.abs(parseInt(n)),
	}

	const UpperCase = {
		check: (s) => s == s.toUpperCase(),
		convert: (s) => s.toUpperCase(),
	}

	const LowerCase = {
		check: (s) => s == s.toLowerCase(),
		convert: (s) => s.toLowerCase(),
	}

	const WhiteSpace = {
		check: (s) => /^[ |	]*$/.test(s),
	}

	const PureObject = {
		check: (o) => o.constructor == Object,
	}

	const Primitive = {
		check: p => p.is(Number) || p.is(String) || p.is(RegExp) || p.is(Symbol),
	}
	
	const install = (global) => {
	
		global.Int = Int
		global.Positive = Positive
		global.Negative = Negative
		global.UInt = UInt
		global.UpperCase = UpperCase
		global.LowerCase = LowerCase
		global.WhiteSpace = WhiteSpace
		global.PureObject = PureObject
		global.Primitive = Primitive
	
		Reflect.defineProperty(global.Object.prototype, "is", {
			value(type) {
				if ("check" in type) {
					try { return type.check(this) }
					catch {}
				}
				try   { return this instanceof type }
				catch { return false }
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Reflect.defineProperty(global.Object.prototype, "as", {
			value(type) {
				if ("convert" in type) {
					try { return type.convert(this) }
					catch {}
				}
				return type(this)
			},
			configurable: true,
			enumerable: false,
			writable: true,
		})
		
		Habitat.Type.installed = true
		
	}
	
	Habitat.Type = {install, Int, Positive, Negative, UInt, UpperCase, LowerCase, WhiteSpace, PureObject, Primitive}
	
}