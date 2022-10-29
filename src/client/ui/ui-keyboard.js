var UiWidget = require('./ui-widget'),
    {icon} = require('./utils'),
    locales = require('../locales'),
    layout = locales('keyboard_layout'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    morph = require('nanomorph')

const numericLayout = [
    '{sep} + 7 8 9',
    '{sep} - 4 5 6',
    '{sep} * 1 2 3',
    '{sep} / {up} 0 .',
    '{sep} {left} {down} {right} {enter}'
]
const keysDisplay = {
    '{esc}':  locales('keyboard_escape'),
    '{bksp}':  icon('delete-left'),
    '{enter}': icon('arrow-turn-down.rotate-90'),
    '{lock}': icon('arrow-up-from-bracket'),
    '{shift}': icon('arrow-up'),
    '{tab}': icon('arrow-right-arrow-left'),
    '{space}': ' ',
    '{left}': icon('arrow-left'),
    '{right}': icon('arrow-right'),
    '{up}': icon('arrow-up'),
    '{down}': icon('arrow-down'),

}

class OscKeybard extends UiWidget {

    constructor(options) {

        super(options)

        this.keys = {}
        this.pressedKeys = {}
        this.repeatKeys = {}
        this.lock = false
        this.shift = false
        this.input = null
        this.value = null
        this.visible = false

        this.display = html`<pre class="textarea"></pre>`
        this.container.appendChild(html`<div class="row">${this.display}</div>`)
        this.cursor = html`<span class="cursor">|</span>`

        for (var k in layout) {
            layout[k] = layout[k].map((r, i)=>(r + ' ' + (numericLayout[i]||'')).trim().split(' '))
        }

        var keyId = 0

        for (var i = 0; i < layout.default.length; i++) {
            var rowData = layout.default[i],
                row = html`<div class="row"></div>`

            for (var j = 0; j < rowData.length; j++) {
                var keyData = rowData[j],
                    shiftData = layout.shift[i][j],
                    key = html`
                    <div class="key">
                        <span class="display-default">${raw(keysDisplay[keyData] || keyData)}</span>
                        <span class="display-shift">${raw(keysDisplay[shiftData] || shiftData)}</span>
                    </div>`

                keyId++
                this.keys[keyId] = key
                key.appendChild = keysDisplay[keyData] || keyData

                key.classList.add(keyData.replace('{', '').replace('}', ''))

                key.setAttribute('data-id', keyId)
                key.setAttribute('data-key', keyData)
                key.setAttribute('data-shift', shiftData)

                row.appendChild(key)
            }
            this.container.appendChild(row)
        }

        this.container.addEventListener('mousedown', (e)=>{
            // prevent keyboard from stealing focus from input
            e.preventDefault()
            // move cursor
            if (this.display.contains(e.target) && e.target !== this.display) {
                var pos = DOM.index(e.target)
                // adjust cursor depening on where we clicked on the letter
                if (e.offsetX - DOM.offset(e.target).left >= e.target.offsetWidth / 2)
                    pos += 1

                this.input.selectionStart = pos
                if (!e.shiftKey) {
                    this.input.selectionEnd = pos
                }
                this.updateCursor()
            }
        }, {capture: true})


        this.on('draginit', (e)=>{

            if (this.pressedKeys[e.pointerId]) return

            var keyId = e.target.getAttribute('data-id')

            if (keyId === null) return

            var key = this.keys[keyId]

            if (key.getAttribute('data-key') === '{lock}') {
                this.lock = !this.lock
                key.classList.toggle('active', this.lock)
            } else {
                key.classList.add('active')
                this.pressedKeys[e.pointerId] = key
            }

            this.checkShift()

            this.repeatKeys[e.pointerId] = [
                setTimeout(()=>{
                    this.repeatKeys[e.pointerId][1] = setInterval(()=>{
                        this.keyDown(key.getAttribute(this.shift !== this.lock ? 'data-shift' : 'data-key'))
                    }, 50)
                },800)
            ]

            this.keyDown(key.getAttribute(this.shift !== this.lock ? 'data-shift' : 'data-key'))

        }, {element: this.container, multitouch: true})

        this.on('dragend', (e)=>{

            if (!this.pressedKeys[e.pointerId]) return

            var key = this.pressedKeys[e.pointerId],
                keyData = key.getAttribute('data-key')

            key.classList.remove('active')

            if (keyData === '{lock}') return

            delete this.pressedKeys[e.pointerId]

            clearTimeout(this.repeatKeys[e.pointerId][0])
            clearInterval(this.repeatKeys[e.pointerId][1])

            this.checkShift()

            this.keyUp(key.getAttribute(this.shift != this.lock ? 'data-shift' : 'data-key'))


        }, {element: this.container, multitouch: true})


        document.addEventListener('focus', (e)=>{
            if (!VIRTUAL_KEYBOARD) return
            // show keyboard when entering input focus
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.show()
                this.input = e.target
                this.value = this.input.value
                setTimeout(()=>{
                    this.updateDisplay()
                })
            }
        }, {capture: true})


        document.addEventListener('blur', (e)=>{
            // hide keyboard when leaving input focus
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.hide()
                this.input = null
                this.value = null

            }
        }, {capture: true})

        document.addEventListener('input', (e)=>{
            // hide keyboard when leaving input focus
            if (e.target === this.input) {
                setTimeout(()=>{ // deffered for code editor
                    this.updateDisplay()
                })
            }
        }, {capture: true})

        document.addEventListener('change', (e)=>{
            // hide keyboard when leaving input focus
            if (e.target === this.input) {
                setTimeout(()=>{
                    this.updateDisplay()
                })
            }
        })

        document.addEventListener('keydown', (e)=>{
            // hide keyboard when leaving input focus
            if (e.target === this.input) {
                setTimeout(()=>{
                    this.updateCursor()
                })
            }
        })

    }

    keyDown(key) {

        if (!this.input) return

        var startPos = this.input.selectionStart,
            endPos = this.input.selectionEnd,
            editLength, str

        switch (key) {
            case '{lock}':
            case '{shift}':
                return
            case '{esc}':
                this.input.value = this.value
                this.input.blur()
                return
            case '{enter}':
                if (this.shift) {
                    str = '\n'
                    editLength = 1
                    break
                } else {
                    this.input.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 13}))
                    if (this.input) DOM.dispatchEvent(this.input, 'change')
                    return
                }
            case '{bksp}':
                this.input.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 8}))
                if (startPos === endPos && startPos === 0) break
                this.input.value = this.input.value.substring(0, startPos - 1)
                    + this.input.value.substring(endPos, this.input.value.length)
                editLength = -1
                break
            case '{tab}':
                str = '  '
                break
            case '{space}':
                str = ' '
                break
            case '{left}':
                this.input.selectionStart = this.input.selectionEnd = Math.max(this.input.selectionStart - 1, 0)
                this.updateCursor()
                return
            case '{right}':
                this.input.selectionStart = this.input.selectionEnd = this.input.selectionStart + 1
                this.updateCursor()
                return
            case '{up}':
            case '{down}':
                if (this.input.value.includes('\n')) {
                    var chars = this.input.value.split('\n').map(x=>x.length + 1),
                        line = 0,
                        charCount = 0,
                        newPos = 0,
                        posAtLine

                    for (let i = 0; i < chars.length; i++) {
                        charCount += chars[i]
                        if (charCount > this.input.selectionStart) {
                            posAtLine = chars[i] - (charCount - this.input.selectionStart)
                            break
                        }
                        line++
                    }
                    line = key === '{up}' ? line - 1 : line + 1
                    for (let i = 0; i < line; i++) {
                        newPos += chars[i]
                    }
                    if (posAtLine > chars[line] - 1) posAtLine = chars[line] - 1

                    this.input.selectionStart =
                    this.input.selectionEnd = newPos + posAtLine
                } else {
                    this.input.selectionStart =
                    this.input.selectionEnd = key === '{up}' ? 0 : this.input.value.length
                }
                this.updateCursor()
                return
            default:
                str = key
                break
        }

        if (str !== undefined) {

            this.input.value = this.input.value.substring(0, startPos)
                + str
                + this.input.value.substring(endPos, this.input.value.length)

            if (editLength === undefined) editLength = str.length

        }

        this.input.selectionStart = startPos + editLength
        this.input.selectionEnd = startPos + editLength
        DOM.dispatchEvent(this.input, 'input')
        DOM.dispatchEvent(this.input, 'keydown')
        // this.input.dispatchEvent(new KeyboardEvent('keydown'))

    }

    keyUp(key) {

    }

    checkShift() {

        var shift = false
        for (var k in this.pressedKeys) {
            var dataKey = this.pressedKeys[k].getAttribute('data-key')
            if (dataKey === '{shift}') {
                shift = true
            }
        }
        this.shift = shift
        this.container.classList.toggle('shift', this.lock !== this.shift)

    }

    updateDisplay() {
        var value = ''
        if (this.input) {
            value = this.input.osc_input ? this.input.osc_input.value :this.input.value
        }

        var content = html`<pre class="textarea"></pre>`
        for (var i in value) {
            let c, nl
            switch (value[i]) {
                case '\n':
                    c = raw('</br>')
                    nl = true
                    break
                case ' ':
                    c = raw('&nbsp;')
                    break
                default:
                    c = value[i]
                    break
            }
            content.appendChild(html`
                <span class="${nl ? 'newline' : ''}">${c}</span>
            `)
        }

        morph(this.display, content)
        this.updateCursor()
    }

    updateCursor() {

        if (!this.input) return

        var pos = this.input.selectionStart
        this.display.classList.remove('first-char-caret')
        DOM.get(this.display, '.caret').map(x=>x.classList.remove('caret'))
        var caretChar = DOM.get(this.display, 'span:nth-child(' + pos + ')')[0]

        if (caretChar) {
            caretChar.classList.add('caret')
            caretChar.scrollIntoView()
        }
        else this.display.classList.add('first-char-caret')

        // if (this.display.contains(this.cursor)) this.display.removeChild(this.cursor)
        // if (pos === 0) this.display.insertBefore(this.cursor)
        // this.display.insert
        // this.display.childr
        // if (this.input) {
        //     this.display.style.setProperty('--cursor', )
        // }
    }

    show(){

        this.visible = true
        this.container.style.display = 'flex'

    }

    hide(){

        this.visible = false
        this.container.style.display = 'none'

        for (let k in this.repeatKeys) {
            clearTimeout(this.repeatKeys[k][0])
            clearInterval(this.repeatKeys[k][1])
        }

        for (let k in this.pressedKeys) {
            this.pressedKeys[k].classList.remove('active')
            delete this.pressedKeys[k]
        }
    }
}

module.exports = new OscKeybard({element: DOM.get('osc-keyboard')[0]})
