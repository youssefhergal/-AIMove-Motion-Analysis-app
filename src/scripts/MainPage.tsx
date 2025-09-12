// import { SplitterMain } from "./SplitterMain"
import { onMount, createEffect, createSignal } from "solid-js"
import { initialize, initializeWhenLoaded } from "./useSceneSetup"
import {
	toggleValue,
	selectedJoint,
	currentAnimationTime,
	mainPageLoaded,
	setMainPageLoaded,
	appIsLoaded,
	scrollBarWidth,
	scaleX,
	setScaleX,
	scaleY,
	setScaleY,
	translateFixerGlobal,
	setTranslateFixerGlobal,
} from "./stores/store"
import { createPlot2D, createPlot3D } from "./plots"
import { myScene } from "./myScene"
import { SplitterMainV_LMenu } from "./SplitterMainV_LMenu"
import { LoadingApp } from "./LoadingApp"

function MainPage() {
	const [isTrue, setIsTrue] = createSignal(false)

	// let hasRun = false
	setMainPageLoaded(false)
	createEffect(async () => {
		selectedJoint()
		if (mainPageLoaded) {
			console.log("PreparePLotsData!!!!!!!!!!!!!!!!!!!!!!!!MAINPAGE")
			await initializeWhenLoaded(true)
		} else {
			setMainPageLoaded(true)
		}
	})

	onMount(async () => {
		await scaleApp()
		await initialize()
	})

	const mystyle = {
		width: "100vw",
		height: "100vh",
		overflow: "hidden",
	}

	return (
		<div id="mainContainer">
			{/* {!appIsLoaded() && <LoadingApp />} */}
			<div style={mystyle} class="mainPage">
				<SplitterMainV_LMenu />
			</div>
			{/*<footer class="footer">
				<div class="footer-content" id="footer">
					<p>
						© 2024 Dimitris Makrygiannis | MINES PARIS - PSL, Centre
						for Robotics
					</p>
					<p>All rights reserved.</p>
				</div>
			</footer>*/}
		</div>
	)
}

export { MainPage }

const scaleApp = () => {
	const appContainer = document.getElementById("mainContainer")
	
	// Set container to full viewport size
	appContainer.style.width = "100vw"
	appContainer.style.height = "100vh"
	appContainer.style.transform = "none"
	appContainer.style.overflow = "hidden"
	
	// Set scale to 1 for full viewport usage
	setScaleX(1)
	setScaleY(1)
	setTranslateFixerGlobal(0)
	
	console.log("App scaled to full viewport:", window.innerWidth, "x", window.innerHeight)
}

export { scaleApp }
