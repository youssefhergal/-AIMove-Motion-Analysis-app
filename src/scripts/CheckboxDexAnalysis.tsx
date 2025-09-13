import { Checkbox } from "@kobalte/core/checkbox"
import { do_gom } from "./tensorflowGOM"
import { myScene } from "./myScene"
import { resizePlots } from "./plots"
import { createEffect } from "solid-js"
import { createVectorPLot } from "./plots"
import { ResizeEverything } from "./ResizeEverything"
import { formatBoneNames, extractJointNames } from "./utils/boneUtils"

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
} from "./stores/store"

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
		// Starting TableAndPlotsUpdate
	
	// Data for table creation
	
	// const eGridDiv = document.querySelector(
	// 	".tabs__content"
	// ) as HTMLElement | null
	// eGridDiv.style.height = `${(1 / scaleX()) * 45}vh`
	
		// Creating table joint
	await set_df_coef_sub(await CreateTableJoint(df_coef(), df_pred()))
		// Table joint created

		// Creating assumption tables
	const df_coef_sub_data = await df_coef_sub()
	const tableA1 = await CreateTableA1(df_coef_sub_data)
		// Created table A1
	set_df_A1(tableA1)
	const tableA2 = await CreateTableA2(df_coef_sub_data)
	set_df_A2(tableA2)
	const tableA3 = await CreateTableA3(df_coef_sub_data)
	set_df_A3(tableA3)
	const tableA4 = await CreateTableA4(df_coef_sub_data)
	set_df_A4(tableA4)
	const tableA5 = await CreateTableA5(df_coef_sub_data)
	set_df_A5(tableA5)
	const tableA6 = await CreateTableA6(df_coef_sub_data)
	set_df_A6(tableA6)
	// All assumption tables created
	setAppIsLoaded(true)
}

async function DoGOM_init() {
		// Starting DoGOM_init
	setAppIsLoaded(false)
	
	// Input data for do_gom
	
	const {
		df_coef: newDfCoef,
		df_pred: newDfPred,
		df_pred_sampled: newDfPredSampled,
	} = await do_gom(inputGOM())
	
	// do_gom results
	
	set_df_coef(newDfCoef.reify())
	set_df_pred(newDfPred)
	set_df_coef_mod(newDfCoef.reify())
	set_df_pred_mod(newDfPred)
	set_df_pred_sampled(newDfPredSampled)
	
		// Data set in store successfully
	TableAndPlotsUpdate()
	setCheckboxFistClick(true)
		// DoGOM_init completed
}

export async function displayTableSwitcher(forceIndex = null) {
	// Starting displayTableSwitcher function
	const assumptionIndex = forceIndex !== null ? forceIndex : selectedAssumptionsIndex()
	// Current assumption index: assumptionIndex
	
	if (assumptionIndex === 11) {
		setSplitterVtable(100)
		setSplitterVplotVector(0)
		// const appContainer = document.getElementById("plotTable")
	} else {
		setSplitterVtable(30)
		setSplitterVplotVector(70)
	}
	
	const tableIndex = assumptionIndex + 1
		// Table index to display
	
	switch (tableIndex) {
		case 3:
			// Displaying table A1
			const tableA1Data = await df_A1()
			displayTable(tableA1Data)
			break
		case 5:
			// Displaying table A2
			displayTable(await df_A2())
			break
		case 7:
			// Displaying table A3
			displayTable(await df_A3())
			break
		case 9:
			// Displaying table A4
			displayTable(await df_A4())
			break
		case 11:
			// Displaying table A5
			displayTable(await df_A5())
			break
		case 12:
			// Displaying table A6
			displayTable(await df_A6())
			break

		default:
			// Displaying default table A1
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
		// mono index
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

