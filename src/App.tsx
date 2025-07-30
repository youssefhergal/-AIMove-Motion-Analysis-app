import "./App.css"
import { onMount, onCleanup, createSignal } from "solid-js"
import { myScene } from "./scripts/myScene"
import { resizePlots } from "./scripts/plots"
import { MainPage } from "./scripts/MainPage"
import { scaleApp } from "./scripts/MainPage"
import { ResizeEverything } from "./scripts/ResizeEverything"

function App() {
	const handler = () => {
		ResizeEverything()
		scaleApp()
	}

	onMount(() => {
		window.addEventListener("resize", handler)
		document.addEventListener("resize", handler)

		document.addEventListener("fullscreenchange", handler)
		document.addEventListener("webkitfullscreenchange", handler)
		document.addEventListener("mozfullscreenchange", handler)
		document.addEventListener("msfullscreenchange", handler)
	})

	// createSignal(() => {
	// 	window.addEventListener("resize", handler)
	// 	document.addEventListener("resize", handler)

	// 	document.addEventListener("fullscreenchange", handler)
	// 	document.addEventListener("webkitfullscreenchange", handler)
	// 	document.addEventListener("mozfullscreenchange", handler)
	// 	document.addEventListener("msfullscreenchange", handler)
	// 	console.log("lalalalal")
	// })

	onCleanup(() => {
		window.removeEventListener("resize", handler)
	})

	return <MainPage />
}

export default App
