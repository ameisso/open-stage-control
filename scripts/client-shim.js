// Dirty browser window shim

document = {
    createElement: x=>({
        ownerDocument: document,
        style: {},
        contentWindow: {},
        nodeName: '',
        childNodes: [],
        setAttribute: ()=>{},
        appendChild: ()=>{},
        lastChild: {},
        toString: ()=>' ',
        removeChild: ()=>{},
        contentWindow: {
            document: {
                open: ()=>{},
                close: ()=>{},
                write: ()=>{},
            }
        }
    }),
    createTextNode: x=>({
        nodeValue: '',
        nodeName: '',
        childNodes: [],
        setAttribute: ()=>{},
        appendChild: ()=>{},
        lastChild: {},
        toString: ()=>' '
    }),
    createElementNS: x=>[],
    addEventListener: ()=>{},
    createRange: ()=>{
        return {
            createContextualFragment:()=>{return {
                firstChild: {
                    querySelectorAll: x=>[]
                }
            }},
            selectNode: ()=>{}
        }
    },
    body: {
        appendChild: ()=>{},
        addEventListener: ()=>{}
    },
    location: {},
    documentElement: {
        appendChild: ()=>{},
        removeChild: ()=>{}
    }
}

window = {
    screen: {width: 800, height: 600},
    addEventListener: ()=>{},
    location: {},
    Image: Function,
    document: document,
    navigator: {
        platform:'',
        userAgent: ''
    },
    NodeList: Array,
    WebSocket: Object,
    localStorage: {
        getItem(){return null}
    },    sessionStorage: {
        getItem(){return null},
            setItem(){},
        },
}

Object.assign(global, window)

// Required globals

DOM = require('../src/client/dom')
DOM.get = x=>[{addEventListener:()=>{}}]
DOM.init()
ELECTRON_NOGPU = false
CANVAS_FRAMERATE = 1
LANG = 'en'
ENV = {id: ''}
IP = ''
