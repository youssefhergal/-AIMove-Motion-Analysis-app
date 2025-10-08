/**
 * GOM Variable Selector - Connected to GOM Tabs
 * Filters joint variables based on GOM assumptions.
 	*/

export interface JointInfo {
	name: string
	side: string
}

export interface EnhancedJointInfo {
	name: string
	depth: number
	parent: string | null
	children: string[]
}

export interface GOMSummary {
	totalJoints: number
	selectedJoints: number
	selectionRate: number
	assumptionName: string
	selectedJointNames: string[]
}

export class GOMVariableSelector {
	private skeletonLeftJoints: string[] = []
	private skeletonRightJoints: string[] = []
	private skeletonHierarchy: Array<EnhancedJointInfo> = []
	
	constructor() {
		// Comprehensive patterns for detecting left/right joints
		// Covers most BVH naming conventions
		this.jointPatterns = {
			right: [
				'right', 'r_', 'r.', 'r-', 'r ', 'r:', 'r=', 'r#',
				'R_', 'R.', 'R-', 'R ', 'R:', 'R=', 'R#',
				'Right', 'RIGHT', 'Rt', 'RT'
			],
			left: [
				'left', 'l_', 'l.', 'l-', 'l ', 'l:', 'l=', 'l#',
				'L_', 'L.', 'L-', 'L ', 'L:', 'L=', 'L#',
				'Left', 'LEFT', 'Lt', 'LT'
			]
		}
		
		// Center joints that don't have left/right variants
		// Note: 'shoulder' removed because LeftShoulder/RightShoulder exist
		this.centerJoints = [
			'hips', 'hip', 'spine', 'chest', 'neck', 'head', 'root',
			'torso', 'trunk', 'pelvis', 'waist', 'back',
			'center', 'middle', 'base', 'spine1', 'spine2', 'spine3'
		]
	}

	private jointPatterns: Record<string, string[]>
	private centerJoints: string[]

	/**
	 * Update skeleton data from SkeletonViewer
	 * This should be called when a new BVH is loaded
	 */
	updateSkeletonData(leftJoints: string[], rightJoints: string[], hierarchy?: Array<EnhancedJointInfo>) {
		this.skeletonLeftJoints = leftJoints
		this.skeletonRightJoints = rightJoints
		this.skeletonHierarchy = hierarchy || []
		console.log(`🔍 Updated skeleton data: ${leftJoints.length} left, ${rightJoints.length} right, ${this.skeletonHierarchy.length} hierarchy`)
	}

	/**
	 * Get hierarchically connected joints (parent-child relationships)
	 * Uses real skeleton hierarchy from Three.js bones
	 * @param targetJoint - The target joint name
	 * @returns Array of connected joint names
	 */
	private getHierarchicallyConnectedJoints(targetJoint: string): string[] {
		if (this.skeletonHierarchy.length === 0) {
			console.warn("⚠️ No hierarchy data available")
			return []
		}
		
		// Extract base joint name (remove axis suffix)
		const baseJointName = targetJoint.split('_')[0]
		
		// Find the target joint in hierarchy
		const targetJointInfo = this.skeletonHierarchy.find(joint => joint.name === baseJointName)
		if (!targetJointInfo) {
			console.warn(`⚠️ Target joint ${baseJointName} not found in hierarchy`)
			console.log(`🔍 Available joints in hierarchy:`, this.skeletonHierarchy.map(j => j.name))
			return []
		}
		
		const connectedJoints: string[] = []
		
		// Add direct parent
		if (targetJointInfo.parent) {
			connectedJoints.push(targetJointInfo.parent)
		}
		
		// Add direct children
		targetJointInfo.children.forEach(childName => {
			connectedJoints.push(childName)
		})
		
		// Additional validation: ensure they are on the same side for left/right joints
		const targetSide = this.detectJointSide(baseJointName)
		const validatedJoints = connectedJoints.filter(jointName => {
			const jointSide = this.detectJointSide(jointName)
			
			// For center joints, allow connections to both sides
			// For left/right joints, only allow connections to the same side
			const isValid = targetSide === 'center' || jointSide === targetSide
			
			return isValid
		})
		
		return validatedJoints
	}

	/**
	 * Get joints that are NOT in any previous assumptions
	 */
	private getNonSerialJoints(targetJoint: string, jointNames: string[]): string[] {
		if (!targetJoint) return jointNames
		
		// Convert joint names to JointInfo format for compatibility
		const joints: JointInfo[] = jointNames.map(name => ({
			name,
			side: this.detectJointSide(name)
		}))
		
		// Get joints from other assumptions
		const intraJointJoints = this.applyIntraJointXY(joints, jointNames, targetJoint)
		const transitioningJoints = this.applyTransitioningAssumption(joints, targetJoint)
		const interLimbJoints = this.applyInterLimbSynergies(joints, jointNames, targetJoint)
		const serialJoints = this.applySerialMediation(joints, jointNames, targetJoint)
		
		// Combine all joints from other assumptions
		const excludedJoints = new Set([
			...intraJointJoints,
			...transitioningJoints,
			...interLimbJoints,
			...serialJoints,
			targetJoint // Exclude target joint itself
		])
		
		// Get target joint side for filtering
		const targetSide = this.detectJointSide(targetJoint)
		
		// Return joints that are NOT in any other assumption AND on the same side
		const nonSerialJoints = jointNames.filter(name => {
			const jointSide = this.detectJointSide(name)
			const isExcluded = excludedJoints.has(name)
			const isSameSide = targetSide === 'center' || jointSide === targetSide
			
			return !isExcluded && isSameSide
		})
		
		
		return nonSerialJoints
	}

	/**
	 * Detect if a joint is left, right, or center
	 */
	private detectJointSide(jointName: string): string {
		// First, try to use skeleton data if available
		if (this.skeletonLeftJoints.length > 0 || this.skeletonRightJoints.length > 0) {
			// Extract base joint name (remove axis suffix like _Xrotation)
			const baseJointName = jointName.split('_')[0]
			
			if (this.skeletonLeftJoints.includes(baseJointName)) {
				return 'left'
			}
			if (this.skeletonRightJoints.includes(baseJointName)) {
				return 'right'
			}
			// If not found in left/right, it's center
			return 'center'
		}
		
		// Fallback to pattern matching if skeleton data not available
		const lowerName = jointName.toLowerCase()
		
		// Check for right side patterns FIRST (before center joints)
		for (const pattern of this.jointPatterns.right) {
			if (lowerName.includes(pattern.toLowerCase())) {
				return 'right'
			}
		}
		
		// Check for left side patterns FIRST (before center joints)
		for (const pattern of this.jointPatterns.left) {
			if (lowerName.includes(pattern.toLowerCase())) {
				return 'left'
			}
		}
		
		// Only check center joints if no left/right patterns were found
		if (this.centerJoints.some(centerJoint => lowerName.includes(centerJoint))) {
				return 'center'
		}
		
		// Default to center if no side indicators found
		return 'center'
	}

	/**
	 * ASSUMPTION: Intra-joint Association (X–Y coordination)
	 * Keep only variables that have the SAME joint name as the target, but DIFFERENT axes
	 * This shows how different axes of the same joint relate to each other
	 * EXCLUDES the target joint and its lags
	 */
	private applyIntraJointXY(joints: JointInfo[], jointNames: string[], targetJoint?: string): string[] {
		if (!targetJoint) return jointNames
		
		// Extract the base joint name and axis from the target
		// Example: "Hips_Xrotation" -> baseJoint: "Hips", axis: "Xrotation"
		const targetParts = targetJoint.split('_')
		if (targetParts.length < 2) return jointNames
		
		// Get the base joint name (everything before the last underscore)
		const baseJoint = targetParts.slice(0, -1).join('_')
		// Get the target axis (last part after underscore)
		const targetAxis = targetParts[targetParts.length - 1]
		
		// Keep only variables that have the SAME joint name but DIFFERENT axes
		// This excludes the target joint and its lags (same joint + same axis)
		const relevantVariables = jointNames.filter(name => {
			// Must contain the base joint name
			if (!name.includes(baseJoint)) {
				return false
			}
			
			// Must NOT contain the same axis (exclude target and its lags)
			if (name.includes(targetAxis)) {
				return false
			}
			
			return true
		})
		
		return relevantVariables
	}

	/**
	 * ASSUMPTION: Transitioning - focus on autoregressive effects
	 * Keeps only variables that represent the SAME joint-axis at different time lags
	 * This is about temporal dependencies, not anatomical relationships
	 */
	private applyTransitioningAssumption(joints: JointInfo[], targetJoint?: string): string[] {
		if (!targetJoint) {
			// If no target joint, return all joints
			return joints.map(joint => joint.name)
		}
		
		// Extract the base joint name and axis from the target
		// Example: "Hips_Xrotation" -> baseJoint: "Hips", axis: "Xrotation"
		const targetParts = targetJoint.split('_')
		if (targetParts.length < 2) {
			return joints.map(joint => joint.name)
		}
		
		// Get the base joint name (everything before the last underscore)
		const baseJoint = targetParts.slice(0, -1).join('_')
		// Get the axis (last part after underscore)
		const axis = targetParts[targetParts.length - 1]
		
		// Find all variables that match the SAME base joint and axis
		// This represents the autoregressive effect: same joint-axis at different time lags
		const relevantJoints = joints.filter(joint => {
			const jointName = joint.name
			
			// Check if this joint name contains the base joint
			if (!jointName.includes(baseJoint)) {
				return false
			}
			
			// Check if this joint name contains the same axis
			return jointName.includes(axis)
		}).map(joint => joint.name)
		
		return relevantJoints
	}

	/**
	 * ASSUMPTION: Inter-limb Synergies - Opposite side joints with same type
	 */
	private applyInterLimbSynergies(joints: JointInfo[], jointNames: string[], targetJoint?: string): string[] {
		if (!targetJoint) return []
		
		// Detect the side of the target joint
		const targetSide = this.detectJointSide(targetJoint)
		
		// Inter-limb synergies ONLY work for left/right joints, NEVER for center joints
		if (targetSide === 'center') {
			console.log(`⚠️ Inter-limb synergies not applicable for center joint: ${targetJoint}`)
			return []
		}
		
		// Extract the base joint name and axis from the target
		const targetParts = targetJoint.split('_')
		if (targetParts.length < 2) return []
		
		// Get the target axis (last part after underscore)
		const targetAxis = targetParts[targetParts.length - 1]
		const baseJointName = targetParts.slice(0, -1).join('_')
		
		// Determine the opposite side
		const oppositeSide = targetSide === 'left' ? 'right' : 'left'
		
		
		// Find joints on the opposite side with the same axis and same joint type
		const oppositeSideJoints = jointNames.filter(name => {
			const side = this.detectJointSide(name)
			const hasAxis = name.toLowerCase().includes(targetAxis.toLowerCase())
			const isOppositeSide = side === oppositeSide
			
			const nameBase = name.split('_')[0]
			
			// Check joint type (primary requirement)
			const isSameJointType = this.isSameJointType(baseJointName, nameBase)
			
			// Check hierarchical depth if both joints are found in hierarchy
			const isSameHierarchicalDepth = this.isSameHierarchicalDepth(baseJointName, nameBase)
			
			
			// Primary requirement: opposite side + same axis + same joint type
			// Secondary requirement: same hierarchical depth (if available)
			return isOppositeSide && hasAxis && isSameJointType && isSameHierarchicalDepth
		})
		
		
		return oppositeSideJoints
	}
	
	/**
	 * Check if two joints have the same hierarchical depth
	 */
	private isSameHierarchicalDepth(joint1: string, joint2: string): boolean {
		// Try to find joints in the hierarchy with flexible matching
		const joint1Info = this.findJointInHierarchy(joint1)
		const joint2Info = this.findJointInHierarchy(joint2)
		
		if (!joint1Info || !joint2Info) {
			// If we can't find either joint in hierarchy, fall back to joint type comparison only
			return this.isSameJointType(joint1, joint2)
		}
		
		const sameDepth = joint1Info.depth === joint2Info.depth
		
		
		return sameDepth
	}
	
	/**
	 * Find a joint in the hierarchy with flexible name matching
	 */
	private findJointInHierarchy(jointName: string): any {
		// First try exact match
		let jointInfo = this.skeletonHierarchy.find(joint => joint.name === jointName)
		if (jointInfo) return jointInfo
		
		// Try case-insensitive match
		jointInfo = this.skeletonHierarchy.find(joint => joint.name.toLowerCase() === jointName.toLowerCase())
		if (jointInfo) return jointInfo
		
		// Try removing common prefixes/suffixes
		const cleanName = jointName.replace(/^(left|right|l_|r_|l\.|r\.|l-|r-|l |r |l:|r:|l=|r=|l#|r#|Left|Right|LEFT|RIGHT|Lt|Rt|LT|RT)/i, '')
		jointInfo = this.skeletonHierarchy.find(joint => {
			const cleanJointName = joint.name.replace(/^(left|right|l_|r_|l\.|r\.|l-|r-|l |r |l:|r:|l=|r=|l#|r#|Left|Right|LEFT|RIGHT|Lt|Rt|LT|RT)/i, '')
			return cleanJointName.toLowerCase() === cleanName.toLowerCase()
		})
		
		return jointInfo || null
	}
	
	/**
	 * Check if two joint names represent the same joint type
	 */
	private isSameJointType(joint1: string, joint2: string): boolean {
		// Remove left/right prefixes to compare base joint types
		// Updated regex to include single letter prefixes (l, r) at the beginning
		const clean1 = joint1.replace(/^(left|right|l_|r_|l\.|r\.|l-|r-|l |r |l:|r:|l=|r=|l#|r#|Left|Right|LEFT|RIGHT|Lt|Rt|LT|RT|l|r)/i, '')
		const clean2 = joint2.replace(/^(left|right|l_|r_|l\.|r\.|l-|r-|l |r |l:|r:|l=|r=|l#|r#|Left|Right|LEFT|RIGHT|Lt|Rt|LT|RT|l|r)/i, '')
		
		const isMatch = clean1.toLowerCase() === clean2.toLowerCase()
		
		
		return isMatch
	}

	/**
	 * ASSUMPTION: Serial Intra-limb Mediation - Neighboring joints
	 */
	private applySerialMediation(joints: JointInfo[], jointNames: string[], targetJoint?: string): string[] {
		if (!targetJoint) return []
		
		// Detect the side of the target joint
		const targetSide = this.detectJointSide(targetJoint)
		
		// Extract the base joint name and axis from the target
		const targetParts = targetJoint.split('_')
		if (targetParts.length < 2) {
			console.log(`⚠️ Target joint ${targetJoint} doesn't have axis suffix`)
			return []
		}
		
		// Get the target axis (last part after underscore)
		const targetAxis = targetParts[targetParts.length - 1]
		const baseJointName = targetParts.slice(0, -1).join('_')
		
		// Get hierarchically connected joints
		const hierarchicallyConnected = this.getHierarchicallyConnectedJoints(targetJoint)
		
		if (hierarchicallyConnected.length === 0) {
			console.log(`⚠️ No hierarchically connected joints found for ${targetJoint}`)
			return []
		}
		
		// Filter based on side and axis
		const serialJoints = jointNames.filter(name => {
			const baseName = name.split('_')[0]
			const hasAxis = name.toLowerCase().includes(targetAxis.toLowerCase())
			
			// Must be hierarchically connected
			if (!hierarchicallyConnected.includes(baseName)) {
				return false
			}
			
			// Must have the same axis
			if (!hasAxis) {
				return false
			}
			
			// For center joints: allow both left and right
			if (targetSide === 'center') {
				return true
			}
			
			// For left/right joints: only same side
			const jointSide = this.detectJointSide(name)
			const isSameSide = jointSide === targetSide
			
			return isSameSide
		})
		
		
		return serialJoints
	}

	/**
	 * ASSUMPTION: Non-serial Intra-limb Mediation - Non-adjacent joints
	 */
	private applyNonSerialMediation(joints: JointInfo[], jointNames: string[], targetJoint?: string): string[] {
		if (!targetJoint) return []
		
		// Get joints that are NOT in any other assumption
		const nonSerialJoints = this.getNonSerialJoints(targetJoint, jointNames)
		
		
		return nonSerialJoints
	}

	/**
	 * Select variables by assumption type - main public method
	 */
	selectVariablesByAssumption(assumptionType: string, jointNames: string[], targetJoint?: string): string[] {
		
		// Convert joint names to JointInfo format for compatibility
		const joints: JointInfo[] = jointNames.map(name => ({
			name,
			side: this.detectJointSide(name)
		}))

		switch (assumptionType.toLowerCase()) {
			case 'intra-joint association':
			case 'intrajoint association':
			case 'xy coordination':
				return this.applyIntraJointXY(joints, jointNames, targetJoint)
				
			case 'transitioning':
			case 'autoregressive':
			case 'temporal dependencies':
				return this.applyTransitioningAssumption(joints, targetJoint)
				
			case 'inter-limb synergies':
			case 'interlimb synergies':
			case 'bilateral coordination':
				return this.applyInterLimbSynergies(joints, jointNames, targetJoint)
				
			case 'serial intra-limb mediation':
			case 'serial intralimb mediation':
			case 'neighboring joints':
				return this.applySerialMediation(joints, jointNames, targetJoint)
				
			case 'non-serial intra-limb mediation':
			case 'non-serial intralimb mediation':
			case 'non-adjacent joints':
				return this.applyNonSerialMediation(joints, jointNames, targetJoint)
				
			default:
				console.warn(`⚠️ Unknown assumption type: ${assumptionType}`)
				return jointNames
		}
	}

	/**
	 * Get GOM summary for display
	 */
	getGOMSummary(assumptionType: string, selectedJoints: string[]): GOMSummary {
		const totalJoints = this.skeletonLeftJoints.length + this.skeletonRightJoints.length + 
			(this.skeletonHierarchy.length - this.skeletonLeftJoints.length - this.skeletonRightJoints.length)
		
		return {
			totalJoints,
			selectedJoints: selectedJoints.length,
			selectionRate: totalJoints > 0 ? (selectedJoints.length / totalJoints) * 100 : 0,
			assumptionName: assumptionType,
			selectedJointNames: selectedJoints
		}
	}
}

// Create a singleton instance
export const gomSelector = new GOMVariableSelector()