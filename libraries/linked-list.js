//============//
// LinkedList //
//============//
{
	LinkedList = class LinkedList {
		constructor(iterable = []) {
			this.start = undefined
			this.end = undefined
			this.isEmpty = true
	
			for (const value of iterable) {
				this.push(value)
			}
		}
		
		*[Symbol.iterator]() {
			let link = this.start
			while (link !== undefined) {
				yield link.value
				link = link.next
			}
		}
	
		push(value) {
			const link = makeLink(value)
			if (this.isEmpty) {
				this.start = link
				this.end = link
				this.isEmpty = false
			} else {
				this.end.next = link
				link.previous = this.end
				this.end = link
			}
		}
	
		pop() {
			
			if (this.isEmpty) {
				return undefined
			}
	
			const value = this.start.value
			if (this.start === this.end) {
				this.clear()
				return value
			}
	
			this.end = this.end.previous
			this.end.next = undefined
			return value
		}
	
		shift() {
	
			if (this.isEmpty) {
				return undefined
			}
	
			const value = this.start.value
			if (this.start === this.end) {
				this.clear()
				return value
			}
	
			this.start = this.start.next
			this.start.previous = undefined
			return value
		}
	
		clear() {
			this.start = undefined
			this.end = undefined
			this.isEmpty = true
		}
	
		setStart(link) {
			this.start = link
			link.previous = undefined
		}

		toString() {
			return [...this].toString()
		}
	
	}
	
	const makeLink = (value) => {
		const previous = undefined
		const next = undefined
		const link = {value, previous, next}
		return link
	}
	
	
}