/**
 * GOM Variable Selector - Connected to GOM Tabs
 * Filters joint variables based on GOM assumptions.
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
	 * EXCLUDES the tar!get joint and its lags
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
	 * ASSUMPTION: Inter-limb Synergies
	 * Return the opposite side of the SAME joint type
	 * Example: RightShoulder_Xrotation → LeftShoulder_Xrotation
	 */
	private applyInterLimbSynergies(joints: JointInfo[], jointNames: string[], targetJoint?: string): string[] {
		if (!targetJoint) return jointNames
		
		// Detect the side of the target joint
		const targetSide = this.detectJointSide(targetJoint)
		
		if (targetSide === 'center') {
			// For center joints (like Hips, Spine), find left/right variants of the same joint type
			const targetParts = targetJoint.split('_')
			if (targetParts.length < 2) return []
			
			const baseJoint = targetParts.slice(0, -1).join('_')
			const axis = targetParts[targetParts.length - 1]
			
			// Find left and right variants of the same joint type with same axis
			const leftVariants = jointNames.filter(name => {
				const side = this.detectJointSide(name)
				const hasAxis = name.toLowerCase().includes(axis.toLowerCase())
				const isSameType = name.toLowerCase().includes(baseJoint.toLowerCase()) || 
								 baseJoint.toLowerCase().includes(name.toLowerCase())
				return side === 'left' && hasAxis && isSameType
			})
			
			const rightVariants = jointNames.filter(name => {
				const side = this.detectJointSide(name)
				const hasAxis = name.toLowerCase().includes(axis.toLowerCase())
				const isSameType = name.toLowerCase().includes(baseJoint.toLowerCase()) || 
								 baseJoint.toLowerCase().includes(name.toLowerCase())
				return side === 'right' && hasAxis && isSameType
			})
			
			// Return both left and right variants for center joints
			return [...leftVariants, ...rightVariants]
		}
		
		// Extract the base joint name and axis from the target
		// Example: "RightShoulder_Xrotation" -> baseJoint: "Shoulder", axis: "Xrotation"
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
		
		const oppositeSideJoints = jointNames.filter(name => {
			// Must start with the opposite side prefix
			if (!name.toLowerCase().startsWith(oppositeSide.toLowerCase())) {
				return false
			}
			
			// Must contain the base joint name (use simpler matching)
			// Check if the name contains the base joint after removing the side prefix
			const nameWithoutSide = name.toLowerCase().replace(new RegExp(`^${oppositeSide.toLowerCase()}`, 'i'), '')
			if (!nameWithoutSide.includes(baseJoint.toLowerCase())) {
				return false
			}
			
			// Must contain the same axis
			return name.toLowerCase().includes(axis.toLowerCase())
		})
		
		return oppositeSideJoints
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
	 * ASSUMPTION: Serial Intra-limb Mediation - Dependencies between neighboring joints
	 * Returns joints that are anatomically connected in sequence based on their position
	 * Focuses on the same side of the body for serial connections
	 */
	private applySerialMediation(joints: JointInfo[], jointNames: string[], targetJoint?: string): string[] {
		if (!targetJoint) return jointNames
		
		// Detect the side of the target joint
		const targetSide = this.detectJointSide(targetJoint)
		
		// Extract the base joint name and axis from the target
		const targetParts = targetJoint.split('_')
		if (targetParts.length < 2) return jointNames
		
		// Get the target axis (last part after underscore)
		const targetAxis = targetParts[targetParts.length - 1]
		
		// Group joints by side and axis to find neighbors
		const jointsBySideAndAxis: Record<string, string[]> = {}
		
		// Initialize groups for each side + axis combination
		jointNames.forEach(name => {
			const side = this.detectJointSide(name)
			const hasAxis = name.toLowerCase().includes(targetAxis.toLowerCase())
			
			if (hasAxis) {
				const key = `${side}_${targetAxis}`
				if (!jointsBySideAndAxis[key]) {
					jointsBySideAndAxis[key] = []
				}
				jointsBySideAndAxis[key].push(name)
			}
		})
		
		// Find the group that contains the target joint
		const targetKey = `${targetSide}_${targetAxis}`
		const targetGroup = jointsBySideAndAxis[targetKey] || []
		
		if (targetGroup.length <= 1) {
			// No neighbors found for this side + axis combination
			return []
		}
		
		// Find neighboring joints (all joints in the same side + axis group, excluding the target)
		const neighboringJoints = targetGroup.filter(name => name !== targetJoint)
		
		return neighboringJoints
	}

	/**
	 * ASSUMPTION: Non-serial Intra-limb Mediation - Dependencies between non-adjacent joints
	 * Returns joints that are on the same side but NOT anatomically connected in sequence
	 * Focuses on the same side of the body for non-serial connections
	 * This captures coordination patterns between distant joints on the same limb/side
	 */
	private applyNonSerialMediation(joints: JointInfo[], jointNames: string[], targetJoint?: string): string[] {
		if (!targetJoint) return jointNames
		
		// Detect the side of the target joint
		const targetSide = this.detectJointSide(targetJoint)
		
		// Extract the base joint name and axis from the target
		const targetParts = targetJoint.split('_')
		if (targetParts.length < 2) return jointNames
		
		// Get the target axis (last part after underscore)
		const targetAxis = targetParts[targetParts.length - 1]
		
		// Step 1: Find all joints on the same side with the same axis
		let sameSideAxisJoints: string[] = []
		
		if (targetSide === 'center') {
			// For center joints (Hips, Spine, etc.), find other center joints and related left/right joints
			const baseJoint = targetParts.slice(0, -1).join('_')
			
			// Find other center joints with the same axis
			const centerJoints = jointNames.filter(name => {
				const side = this.detectJointSide(name)
				const hasAxis = name.toLowerCase().includes(targetAxis.toLowerCase())
				return side === 'center' && hasAxis && name !== targetJoint
			})
			
			// Find left/right joints that are anatomically related to the center joint
			// For Hips, look for LeftHip, RightHip, LeftUpLeg, RightUpLeg, etc.
			const relatedLeftJoints = jointNames.filter(name => {
				const side = this.detectJointSide(name)
				const hasAxis = name.toLowerCase().includes(targetAxis.toLowerCase())
				const isRelated = this.isAnatomicallyRelated(baseJoint, name)
				return side === 'left' && hasAxis && isRelated
			})
			
			const relatedRightJoints = jointNames.filter(name => {
				const side = this.detectJointSide(name)
				const hasAxis = name.toLowerCase().includes(targetAxis.toLowerCase())
				const isRelated = this.isAnatomicallyRelated(baseJoint, name)
				return side === 'right' && hasAxis && isRelated
			})
			
			// Combine all related joints
			sameSideAxisJoints = [...centerJoints, ...relatedLeftJoints, ...relatedRightJoints]
			
			if (sameSideAxisJoints.length === 0) {
				return []
			}
		} else {
			// Normal case: target has a side
			sameSideAxisJoints = jointNames.filter(name => {
				const side = this.detectJointSide(name)
				const hasAxis = name.toLowerCase().includes(targetAxis.toLowerCase())
				return side === targetSide && hasAxis && name !== targetJoint
			})
		}
		
		if (sameSideAxisJoints.length === 0) {
			return []
		}
		
		// Step 2: Group joints by their base name to identify potential hierarchies
		const jointGroups: Record<string, string[]> = {}
		
		sameSideAxisJoints.forEach(jointName => {
			// Extract base joint name (remove side prefix and axis suffix)
			const baseName = this.extractBaseJointName(jointName, targetSide === 'center' ? 'left' : targetSide)
			if (!jointGroups[baseName]) {
				jointGroups[baseName] = []
			}
			jointGroups[baseName].push(jointName)
		})
		
		// Find the target joint's group
		const targetBaseName = this.extractBaseJointName(targetJoint, targetSide === 'center' ? 'left' : targetSide)
		const targetGroup = jointGroups[targetBaseName] || []
		
		// Find non-adjacent joints within the same group
		const nonAdjacentJoints: string[] = []
		
		if (targetGroup.length > 2) {
			// Sort by name to establish a consistent order for distance calculation
			const sortedGroup = targetGroup.sort()
			const targetIndex = sortedGroup.indexOf(targetJoint)
			
			sortedGroup.forEach((joint, index) => {
				if (joint === targetJoint) return
				
				// Calculate distance from target (skip adjacent joints)
				const distance = Math.abs(index - targetIndex)
				if (distance > 1) {
					nonAdjacentJoints.push(joint)
				}
			})
		}
		
		// Include joints from other groups on the same side (different body regions)
		for (const [baseName, joints] of Object.entries(jointGroups)) {
			if (baseName === targetBaseName) continue // Skip same group
			
			// Add all joints from different groups (they are inherently non-adjacent)
			nonAdjacentJoints.push(...joints)
		}
		
		// Remove duplicates
		const uniqueNonAdjacentJoints = [...new Set(nonAdjacentJoints)]
		
		return uniqueNonAdjacentJoints
	}
	
	/**
	 * Helper method to extract base joint name without side prefix and axis suffix
	 */
	private extractBaseJointName(jointName: string, side: string): string {
		// Remove side prefix (e.g., "Left", "Right")
		let baseName = jointName.replace(new RegExp(`^${side}`, 'i'), '')
		
		// Remove axis suffix (e.g., "_Xrotation", "_Yrotation")
		// Find the last underscore and remove everything after it
		const lastUnderscoreIndex = baseName.lastIndexOf('_')
		if (lastUnderscoreIndex !== -1) {
			baseName = baseName.substring(0, lastUnderscoreIndex)
		}
		
		return baseName
	}

	/**
	 * Check if two joints are anatomically related for Non-serial Intra-limb Mediation
	 * This helps identify joints that are connected but not in a direct sequence
	 */
	private isAnatomicallyRelated(centerJoint: string, otherJoint: string): boolean {
		const centerLower = centerJoint.toLowerCase()
		const otherLower = otherJoint.toLowerCase()
		
		// Remove side prefixes for comparison
		const otherWithoutSide = otherLower.replace(/^(left|right)/, '')
		
		// Define anatomical relationships
		const relationships = {
			'hips': ['hip', 'upleg', 'leg', 'thigh', 'knee', 'ankle', 'foot'],
			'spine': ['spine', 'chest', 'neck', 'head', 'shoulder', 'arm', 'forearm', 'hand'],
			'chest': ['spine', 'neck', 'head', 'shoulder', 'arm', 'forearm', 'hand'],
			'neck': ['spine', 'chest', 'head', 'shoulder'],
			'head': ['spine', 'chest', 'neck']
		}
		
		// Check if the center joint is related to the other joint
		for (const [centerKey, relatedTerms] of Object.entries(relationships)) {
			if (centerLower.includes(centerKey)) {
				return relatedTerms.some(term => otherWithoutSide.includes(term))
			}
		}
		
		// Default: if the base names are similar, they might be related
		const centerBase = centerLower.replace(/^(left|right)/, '')
		return otherWithoutSide.includes(centerBase) || centerBase.includes(otherWithoutSide)
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
			case 5: // Serial Intra-limb Mediation → neighboring joints in same hierarchy
				result = this.applySerialMediation(joints, jointNames, targetJoint)
				break
			case 6: // Non-serial Intra-limb Mediation → non-adjacent joints on same side
				result = this.applyNonSerialMediation(joints, jointNames, targetJoint)
				break
			default:
				console.warn(`⚠️ Unknown assumption index: ${assumptionIndex}, returning all joints`)
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
			'Inter-limb Synergies (Opposite Side)',
			'Serial Intra-limb Mediation (Neighboring Joints)',
			'Non-serial Intra-limb Mediation (Non-adjacent Joints)'
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

