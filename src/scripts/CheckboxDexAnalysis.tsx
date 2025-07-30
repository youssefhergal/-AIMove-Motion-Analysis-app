import { Checkbox } from "@kobalte/core/checkbox"
import { do_gom } from "./tensorflowGOM"
import { myScene } from "./myScene"
import { resizePlots } from "./plots"
import { createEffect } from "solid-js"
import { createVectorPLot } from "./plots"
import { ResizeEverything } from "./ResizeEverything"
import { formatBoneNames, extractJointNames } from "./useSceneSetup"

import {
	displayTable,
	CreateTableJoint,
	CreateTableA1,
	CreateTableA2,
	CreateTableA3,
	CreateTableA4,
	CreateTableA5,
	CreateTableA6,
} from "./tables"

import {
	setSplitterSizeL,
	setSplitterSizeR,
	inputGOM,
	outputGOM,
	setOutputGOM,
	selectedJoint,
	axisSelected,
	setAxisSelected,
	selectedAssumptionsIndex,
	df_coef,
	set_df_coef,
	df_pred,
	set_df_pred,
	df_coef_sub,
	set_df_coef_sub,
	df_A1,
	set_df_A1,
	df_A2,
	set_df_A2,
	df_A3,
	set_df_A3,
	df_A4,
	set_df_A4,
	df_A5,
	set_df_A5,
	df_A6,
	set_df_A6,
	checkboxFistClick,
	setCheckboxFistClick,
	setSplitterVtable,
	setSplitterVplotVector,
	scaleX,
	setAppIsLoaded,
	checkboxValue,
	setCheckboxValue,
	df_coef_mod,
	set_df_coef_mod,
	df_pred_mod,
	set_df_pred_mod,
	df_pred_sampled,
	set_df_pred_sampled,
	bonesList,
	setBonesList,
} from "./store"

import {
	ColDef,
	ColGroupDef,
	GridApi,
	GridOptions,
	ModuleRegistry,
	createGrid,
} from "ag-grid-community"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"

import * as aq from "arquero"
import { op } from "arquero"

async function TableAndPlotsUpdate() {
	// const eGridDiv = document.querySelector(
	// 	".tabs__content"
	// ) as HTMLElement | null
	// eGridDiv.style.height = `${(1 / scaleX()) * 45}vh`
	await set_df_coef_sub(await CreateTableJoint(df_coef(), df_pred()))

	set_df_A1(await CreateTableA1(df_coef_sub()))
	set_df_A2(await CreateTableA2(df_coef_sub()))
	set_df_A3(await CreateTableA3(df_coef_sub()))
	set_df_A4(await CreateTableA4(df_coef_sub()))
	set_df_A5(await CreateTableA5(df_coef_sub()))
	set_df_A6(await CreateTableA6(df_coef_sub()))

	console.log("update ola")
	setAppIsLoaded(true)
}

async function DoGOM_init() {
	setAppIsLoaded(false)
	const {
		df_coef: newDfCoef,
		df_pred: newDfPred,
		df_pred_sampled: newDfPredSampled,
	} = await do_gom(inputGOM())
	set_df_coef(newDfCoef.reify())
	set_df_pred(newDfPred)
	set_df_coef_mod(newDfCoef.reify())
	set_df_pred_mod(newDfPred)
	set_df_pred_sampled(newDfPredSampled)

	TableAndPlotsUpdate()
	setCheckboxFistClick(true)
}

async function displayTableSwitcher() {
	if (selectedAssumptionsIndex() === 11) {
		setSplitterVtable(100)
		setSplitterVplotVector(0)
		// const appContainer = document.getElementById("plotTable")
	} else {
		setSplitterVtable(33)
		setSplitterVplotVector(67)
	}
	switch (selectedAssumptionsIndex() + 1) {
		case 3:
			displayTable(await df_A1())

			break
		case 5:
			displayTable(await df_A2())
			break
		case 7:
			displayTable(await df_A3())
			break
		case 9:
			displayTable(await df_A4())
			break
		case 11:
			displayTable(await df_A5())
			break
		case 12:
			displayTable(await df_A6())
			break

		default:
			displayTable(await df_A1())

			break
	}
}
const CheckboxDexAnalysis = () => {
	function thisOnChange() {
		ResizeEverything()
	}

	function throttle(fn, delay) {
		let lastCall = 0
		return (...args) => {
			const now = new Date().getTime()
			if (now - lastCall < delay) return
			lastCall = now
			fn(...args)
		}
	}

	createEffect(async () => {
		console.log("mono index")
		// selectedAssumptionsTrigger()

		await displayTableSwitcher()
	})

	return (
		<Checkbox
			class="checkbox"
			onChange={async (e) => {
				setCheckboxValue(e)
				if (e) {
					await setSplitterSizeL(45)
					await setSplitterSizeR(55)

					await thisOnChange()

					setBonesList(extractJointNames(bonesList()))
					// const appContainer =
					// 	document.getElementById("mainContainer")

					// const element =
					// 	document.querySelector<HTMLElement>(".tabs__content")
					// const appContainerHeight = appContainer.clientHeight
					// element.style.height = `${appContainerHeight * 0.45}px`
					if (!checkboxFistClick()) {
						await DoGOM_init()
					}
				} else {
					await setSplitterSizeL(100)
					await setSplitterSizeR(0)
					await thisOnChange()
					await setBonesList(formatBoneNames(myScene.boneHierarchy))
				}
			}}
		>
			<Checkbox.Input class="checkbox__input" />
			<Checkbox.Control class="checkbox__control">
				<Checkbox.Indicator>&#10004;</Checkbox.Indicator>
			</Checkbox.Control>
			<Checkbox.Label class="checkbox__label">
				Dexterity Analysis
			</Checkbox.Label>
		</Checkbox>
	)
}

export { CheckboxDexAnalysis, TableAndPlotsUpdate, DoGOM_init }
