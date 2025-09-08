import { onMount, createEffect, createSignal } from "solid-js"
import { initialize, initializeWhenLoaded } from "./useSceneSetup"

import {
	toggleValue,
	selectedJoint,
	currentAnimationTime,
	mainPageLoaded,
	setMainPageLoaded,
	appIsLoaded,
	scaleX,
	setScaleX,
	setTranslateFixerGlobal,
} from "./store"
import { createPlot2D, createPlot3D } from "./plots"
import { myScene } from "./myScene"
import { SplitterMainV_LMenu } from "./SplitterMainV_LMenu"
import { LoadingApp } from "./LoadingApp"
import { AlertWrongMode } from "./AlertWrongMode"

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
		width: "100% ",
		height: "100%",
		flex: 1,
		overflow: "auto",
	}

	return (
		<div id="mainContainer">
			{!appIsLoaded() && <LoadingApp />}
			<AlertWrongMode />
			<div style={mystyle} class="mainPage">
				<SplitterMainV_LMenu />
			</div>
			{/*<footer class="footer">
				<div class="footer-content" id="footer">
					<p>
						© 2024 Dimitrios Makrygiannis | MINES PARIS - PSL, Centre for
						Robotics
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

	if (2.014 >= window.innerWidth / window.innerHeight) {
		setScaleX(window.innerWidth / 1920)
		const widthFixer = (1 / scaleX()) * 100
		const translateFixer = (100 - widthFixer) / 2
		setTranslateFixerGlobal(translateFixer)

		if (scaleX() > 1) {
			appContainer.style.transform = `scale(${scaleX()}) translate(${translateFixer}%,${0}%)`
		} else {
			appContainer.style.transform = `scale(${scaleX()}) translate(${translateFixer}%,${translateFixer}%)`
		}
		appContainer.style.width = `${widthFixer}svw`
		appContainer.style.height = `${widthFixer}svh`

		// console.log("mikrotero")
	} else {
		function calculateWidth(height) {
			const aspectRatio = 1920 / 953
			const width = height * aspectRatio
			return width
		}

		setScaleX(calculateWidth(window.innerHeight) / 1920)

		const widthFixer = (1 / scaleX()) * 100
		const translateFixer = (100 - widthFixer) / 2
		setTranslateFixerGlobal(translateFixer)

		appContainer.style.transform = `scale(${scaleX()}) translate(${translateFixer}%,${translateFixer}%)`
		appContainer.style.width = `${widthFixer}svw`

		appContainer.style.height = `${widthFixer}svh`

		// console.log("megalyetero", calculateWidth(appContainer.clientHeight))
	}
}

export { scaleApp }
