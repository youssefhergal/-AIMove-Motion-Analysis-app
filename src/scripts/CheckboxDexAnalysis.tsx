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
	console.log("🔄 Starting TableAndPlotsUpdate function")
	
	console.log("📊 Data for table creation:", {
		df_coef: {
			hasData: !!df_coef(),
			length: df_coef()?.length
		},
		df_pred: {
			hasData: !!df_pred(),
			length: df_pred()?.length
		}
	})
	
	// const eGridDiv = document.querySelector(
	// 	".tabs__content"
	// ) as HTMLElement | null
	// eGridDiv.style.height = `${(1 / scaleX()) * 45}vh`
	
	console.log("🔄 Creating table joint...")
	await set_df_coef_sub(await CreateTableJoint(df_coef(), df_pred()))
	console.log("✅ Table joint created")

	console.log("🔄 Creating assumption tables...")
	const df_coef_sub_data = await df_coef_sub()
	const tableA1 = await CreateTableA1(df_coef_sub_data)
	console.log("📊 Created table A1:", {isDataFrame: !!tableA1.columnNames, type: typeof tableA1})
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
	console.log("✅ All assumption tables created")

	console.log("update ola")
	setAppIsLoaded(true)
	console.log("✅ TableAndPlotsUpdate completed")
}

async function DoGOM_init() {
	console.log("🚀 Starting DoGOM_init function")
	setAppIsLoaded(false)
	
	console.log("📊 Input data for do_gom:", {
		inputGOM: inputGOM(),
		length: inputGOM()?.length,
		isArray: Array.isArray(inputGOM())
	})
	
	const {
		df_coef: newDfCoef,
		df_pred: newDfPred,
		df_pred_sampled: newDfPredSampled,
	} = await do_gom(inputGOM())
	
	console.log("📊 do_gom results:", {
		df_coef: {
			hasData: !!newDfCoef,
			length: newDfCoef?.length,
			type: typeof newDfCoef
		},
		df_pred: {
			hasData: !!newDfPred,
			length: newDfPred?.length,
			type: typeof newDfPred
		},
		df_pred_sampled: {
			hasData: !!newDfPredSampled,
			length: newDfPredSampled?.length,
			type: typeof newDfPredSampled
		}
	})
	
	set_df_coef(newDfCoef.reify())
	set_df_pred(newDfPred)
	set_df_coef_mod(newDfCoef.reify())
	set_df_pred_mod(newDfPred)
	set_df_pred_sampled(newDfPredSampled)
	
	console.log("✅ Data set in store successfully")
	console.log("🔄 Calling TableAndPlotsUpdate...")
	TableAndPlotsUpdate()
	setCheckboxFistClick(true)
	console.log("✅ DoGOM_init completed successfully")
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
	console.log("📊 Table index to display:", tableIndex)
	
	switch (tableIndex) {
		case 3:
			console.log("🔄 Displaying table A1...")
			const tableA1Data = await df_A1()
			console.log("📊 Retrieved table A1:", {isDataFrame: !!tableA1Data?.columnNames, type: typeof tableA1Data, length: tableA1Data?.length})
			displayTable(tableA1Data)
			break
		case 5:
			console.log("🔄 Displaying table A2...")
			displayTable(await df_A2())
			break
		case 7:
			console.log("🔄 Displaying table A3...")
			displayTable(await df_A3())
			break
		case 9:
			console.log("🔄 Displaying table A4...")
			displayTable(await df_A4())
			break
		case 11:
			console.log("🔄 Displaying table A5...")
			displayTable(await df_A5())
			break
		case 12:
			console.log("🔄 Displaying table A6...")
			displayTable(await df_A6())
			break

		default:
			console.log("🔄 Displaying default table A1...")
			displayTable(await df_A1())
			break
	}
	console.log("✅ displayTableSwitcher completed")
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

