if (!Object.values) {

    Object.values = function(e){
        // @https://github.com/JoHNNyRiver/poyfillObject
        return Array.prototype.map.call(Object.keys(e), function(t,r){return e[t]})
    }

}

if (!NodeList.prototype.forEach) {

    NodeList.prototype.forEach = Array.prototype.forEach

}

if (!HTMLCollection.prototype.forEach) {

    HTMLCollection.prototype.forEach = Array.prototype.forEach

}
