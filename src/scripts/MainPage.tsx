// import { SplitterMain } from "./SplitterMain"
import { onMount, createEffect, createSignal } from "solid-js"
import { initialize, preparePlotsData } from "./useSceneSetup"
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
} from "./store"
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
			// myScene.mixer.timeScale = 1
			console.log("PreparePLotsData!!!!!!!!!!!!!!!!!!!!!!!!MAINPAGE")
			// Check if timeScale is initially 0 to know if it needs to be reset later
			const shouldResetTimeScale = myScene.mixer.timeScale === 0

			// Conditionally set timeScale to 1 if it was 0
			if (shouldResetTimeScale) {
				myScene.mixer.timeScale = 1
			}
			await preparePlotsData()
			await createPlot2D(currentAnimationTime(), toggleValue())
			await createPlot3D(currentAnimationTime())
			if (shouldResetTimeScale) {
				myScene.mixer.timeScale = 0
			}
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
			<div style={mystyle} class="mainPage">
				<SplitterMainV_LMenu />
			</div>
			<footer class="footer">
				<div class="footer-content" id="footer">
					<p>
						© 2024 Dimitris Makrygiannis | MINES PARIS - PSL, Centre
						for Robotics
					</p>
					<p>All rights reserved.</p>
				</div>
			</footer>
		</div>
	)
}

export { MainPage }

const scaleApp = () => {
	const appContainer = document.getElementById("mainContainer")
	// const parentElement = appContainer.parentElement
	// const parentElement2 = parentElement.parentElement
	// console.log(parentElement2)
	// const scaleX = appContainer.clientWidth / 1920
	// const scaleY = appContainer.clientHeight / 953

	// console.log("window diastaseis: ", window.innerWidth, window.innerHeight)

	// if (1920 / 953 >= parentElement.clientWidth / parentElement.clientHeight) {

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
		appContainer.style.width = `${widthFixer}vw`
		appContainer.style.height = `${widthFixer}vh`

		console.log("mikrotero")
	} else {
		function calculateWidth(height) {
			const aspectRatio = 1920 / 953
			const width = height * aspectRatio
			return width
		}

		function widthInVw(height) {
			const width = calculateWidth(height)
			const viewportWidth = window.innerWidth
			const widthVw = (width / viewportWidth) * 100
			return widthVw
		}
		setScaleX(calculateWidth(window.innerHeight) / 1920)

		// const widthFixer = (1 / scaleX) * widthInVw(window.innerHeight)
		const widthFixer = (1 / scaleX()) * 100
		const translateFixer = (100 - widthFixer) / 2
		setTranslateFixerGlobal(translateFixer)

		appContainer.style.transform = `scale(${scaleX()}) translate(${translateFixer}%,${translateFixer}%)`
		appContainer.style.width = `${widthFixer}vw`

		appContainer.style.height = `${widthFixer}vh`

		console.log("megalyetero", calculateWidth(appContainer.clientHeight))
	}
}

export { scaleApp }
