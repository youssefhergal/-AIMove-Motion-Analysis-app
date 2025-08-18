/**
 * GOM Variable Selector - Connected to GOM Tabs
 * ==============================================
 * 
 * This utility filters joint variables based on GOM assumptions.
 * Now connected to the actual GOM tab system.
 */

export interface JointInfo {
	name: string
	side: string
}

export interface GOMSummary {
	totalJoints: number
	selectedJoints: number
	selectionRate: number
	assumptionName: string
	selectedJointNames: string[]
}

export class GOMVariableSelector {
	
	constructor() {
		// Simple patterns for detecting left/right joints
		this.jointPatterns = {
			right: ['right', 'r_', 'r.', 'r-', 'r '],
			left: ['left', 'l_', 'l.', 'l-', 'l '],
		}
	}

	private jointPatterns: Record<string, string[]>

	/**
	 * Detect if a joint is left, right, or center
	 */
	private detectJointSide(jointName: string): string {
		const lowerName = jointName.toLowerCase()
		
		for (const [side, patterns] of Object.entries(this.jointPatterns)) {
			if (patterns.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				return side
			}
		}
		return 'center' // Joints like Hips, Spine, etc.
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
		return jointNames.filter(name => {
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
	}

	/**
	 * ASSUMPTION: Inter-limb Synergies
	 * Return the opposite side of the SAME joint type
	 * Example: RightShoulder_Xrotation → LeftShoulder_Xrotation
	 */
	private applyInterLimbSynergies(joints: JointInfo[], jointNames: string[], targetJoint?: string): string[] {
		if (!targetJoint) return jointNames
		
		// Detect the side of the target joint
		const targetSide = this.detectJointSide(targetJoint)
		
		if (targetSide === 'center') {
			// If target is center (like Hips, Spine), no intra-limb synergy possible
			return []
		}
		
		// Extract the base joint name and axis from the target
		const targetParts = targetJoint.split('_')
		if (targetParts.length < 2) return jointNames
		
		// Get the axis (last part after underscore)
		const axis = targetParts[targetParts.length - 1]
		
		// Get the base joint name more precisely
		// For "LeftArm_Xrotation": remove "Left" prefix and "_Xrotation" suffix
		const sidePrefix = targetSide === 'left' ? 'left' : 'right'
		const baseJoint = targetParts.slice(0, -1).join('_').replace(new RegExp(`^${sidePrefix}`, 'i'), '')
		
		// Find the opposite side of the SAME joint type with the same axis
		const oppositeSide = targetSide === 'left' ? 'right' : 'left'
		
		return jointNames.filter(name => {
			// Must start with the opposite side prefix
			if (!name.toLowerCase().startsWith(oppositeSide.toLowerCase())) {
				return false
			}
			
			// Must contain the EXACT base joint name (not partial matches)
			// For "LeftArm" -> baseJoint = "Arm", we want "RightArm" NOT "RightForeArm"
			const nameWithoutSide = name.toLowerCase().replace(new RegExp(`^${oppositeSide.toLowerCase()}`, 'i'), '')
			
			// Check if the base joint appears as a complete word in the name
			// This prevents "Arm" from matching "ForeArm" or "Arm2"
			const baseJointLower = baseJoint.toLowerCase()
			const nameWords = nameWithoutSide.split(/[_\s]/) // Split by underscore or space
			
			// Look for exact word match
			const hasExactMatch = nameWords.some(word => word === baseJointLower)
			if (!hasExactMatch) {
				return false
			}
			
			// Must contain the same axis
			return name.toLowerCase().includes(axis.toLowerCase())
		})
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
		return joints.filter(joint => {
			const jointName = joint.name
			
			// Check if this joint name contains the base joint
			if (!jointName.includes(baseJoint)) {
				return false
			}
			
			// Check if this joint name contains the same axis
			return jointName.includes(axis)
		}).map(joint => joint.name)
	}

	/**
	 * Main function to select variables based on assumption
	 */
	selectVariablesByAssumption(jointNames: string[], assumptionIndex: number, targetJoint?: string): string[] {
		if (!jointNames || jointNames.length === 0) return []
		
		// Convert joint names to JointInfo objects (only need side info)
		const joints = jointNames.map(name => ({
			name,
			side: this.detectJointSide(name)
		}))

		let result: string[]
		
		// Implement GOM assumptions based on the tab system
		switch (assumptionIndex) {
			case 0: // All joints (GOM Overview)
				result = jointNames
				break
			case 2: // Transitioning - focus on joints related to target (autoregressive same joint-axis)
				result = this.applyTransitioningAssumption(joints, targetJoint)
				break
			case 3: // Intra-joint Association (X–Y coordination) → same joint, different axes
				result = this.applyIntraJointXY(joints, jointNames, targetJoint)
				break
			case 4: // Inter-limb Synergies → opposite side of target joint
				result = this.applyInterLimbSynergies(joints, jointNames, targetJoint)
				break
			default:
				result = jointNames
		}
		
		return result
	}

	/**
	 * Get summary statistics
	 */
	getGOMSummary(jointNames: string[], assumptionIndex: number, targetJoint?: string): GOMSummary {
		const selected = this.selectVariablesByAssumption(jointNames, assumptionIndex, targetJoint)
		
		const assumptionNames = [
			'All Joints',
			'Autoregressive (Same Joint-Axis)', 
			'Transitioning (Temporal Dependencies)',
			'Intra-joint Association (X-Y Coordination)',
			'Inter-limb Synergies (Opposite Side)'
		]
		
		return {
			totalJoints: jointNames.length,
			selectedJoints: selected.length,
			selectionRate: selected.length / jointNames.length,
			assumptionName: assumptionNames[assumptionIndex] || 'Unknown',
			selectedJointNames: selected
		}
	}
}

// Create and export instance
export const gomSelector = new GOMVariableSelector()
export default GOMVariableSelector
