/**
 * GOM Variable Selector - Integrated with Existing Assumption System
 * =================================================================
 * 
 * This utility integrates with the existing assumption tabs:
 * - GOM (index 0)
 * - Transitioning (index 2) 
 * - Intra-joint association (index 4)
 * - Inter-limb synergy (index 6)
 * - Serial intra-limb mediation (index 8)
 * - Non-serial intra-limb mediation (index 10)
 * - All assumptions statistics (index 12)
 * 
 * @author youssef hergal
 * @version 1.0
 */

/**
 * Main GOM variable selection function based on assumption index
 * @param {Array} channels - Array of channel names from BVH
 * @param {number} assumptionIndex - Index from selectedAssumptionsIndex
 * @returns {Array} Filtered variables based on assumption
 */
export const selectGOMVariablesByAssumption = (channels, assumptionIndex) => {
    if (!channels || channels.length === 0) {
        console.warn('⚠️ No channels provided for GOM selection')
        return []
    }

    console.log('🔍 GOM selection for assumption index:', assumptionIndex, 'with', channels.length, 'channels')

    // Map the actual toggle group indices to GOM assumptions
    // The toggle group has: [0: GOM, 1: =, 2: Transitioning, 3: +, 4: Intra-joint, 5: +, 6: Inter-limb, 7: +, 8: Serial, 9: +, 10: Non-serial, 11: +, 12: All stats]
    switch (assumptionIndex) {
        case 0: // GOM - All variables
            return channels
            
        case 2: // Transitioning - Variables with inertia effect
            return getTransitioningVariables(channels)
            
        case 4: // Intra-joint association - X/Y rotations for same joint
            return getIntrajointVariables(channels)
            
        case 6: // Inter-limb synergy - Coordinated body parts
            return getInterlimbVariables(channels)
            
        case 8: // Serial intra-limb mediation - Neighboring joints
            return getIntralimbVariables(channels).serial
            
        case 10: // Non-serial intra-limb mediation - Non-neighboring joints
            return getIntralimbVariables(channels).nonSerial
            
        case 12: // All assumptions statistics - All variables
            return channels
            
        default:
            console.warn('⚠️ Unknown assumption index:', assumptionIndex, '- returning all variables')
            return channels
    }
}

/**
 * Identifies variables that exhibit Intrajoint Association
 * (bidirectional relationship between X and Y movements)
 */
export const getIntrajointVariables = (channels) => {
    const intrajointVars = []
    const jointGroups = {}

    // Group channels by joint name (removing axis suffix)
    channels.forEach(channel => {
        const baseName = channel.replace(/_(X|Y|Z)?rotation$/, '')
        if (!jointGroups[baseName]) {
            jointGroups[baseName] = []
        }
        jointGroups[baseName].push(channel)
    })

    // Find joints with multiple rotation axes
    Object.entries(jointGroups).forEach(([jointName, axes]) => {
        if (axes.length >= 2) {
            intrajointVars.push(...axes)
        }
    })

    console.log('🔄 Intrajoint variables found:', intrajointVars.length)
    return intrajointVars
}

/**
 * Identifies variables that exhibit Transitioning behavior
 * (dependencies on their own history - inertia effect)
 */
export const getTransitioningVariables = (channels) => {
    // All rotation channels exhibit transitioning behavior
    const transitioningVars = channels.filter(channel => channel.includes('rotation'))
    console.log('⏭️ Transitioning variables found:', transitioningVars.length)
    return transitioningVars
}

/**
 * Identifies variables that exhibit Interlimb Synergies
 * (body parts working together for specific motion trajectories)
 * Uses dynamic pattern matching based on actual variable names
 */
export const getInterlimbVariables = (channels) => {
    const interlimbVars = []
    
    // Extract all unique joint base names (without axis suffix)
    const jointBaseNames = [...new Set(channels.map(channel => 
        channel.replace(/_(X|Y|Z)?rotation$/, '')
    ))]
    
    // Group joints by common patterns
    const patternGroups = {}
    
    jointBaseNames.forEach(jointName => {
        // Look for common prefixes (e.g., "Left", "Right", "Upper", "Lower", "hipx_")
        const prefix = jointName.match(/^(Left|Right|Upper|Lower|Front|Back|Top|Bottom|hipx_)/i)
        if (prefix) {
            const base = jointName.replace(/^(Left|Right|Upper|Lower|Front|Back|Top|Bottom|hipx_)/i, '')
            if (!patternGroups[base]) patternGroups[base] = []
            patternGroups[base].push(jointName)
        }
        
        // Look for common suffixes (e.g., "Arm", "Leg", "Hand", "Foot")
        const suffix = jointName.match(/(Arm|Leg|Hand|Foot|Shoulder|Elbow|Wrist|Hip|Knee|Ankle)$/i)
        if (suffix) {
            const base = jointName.replace(/(Arm|Leg|Hand|Foot|Shoulder|Elbow|Wrist|Hip|Knee|Ankle)$/i, '')
            if (!patternGroups[base]) patternGroups[base] = []
            patternGroups[base].push(jointName)
        }
    })
    
    // Find joints that work together (have 2+ joints in same pattern group)
    console.log('🔍 Pattern groups detected:', patternGroups)
    
    Object.entries(patternGroups).forEach(([base, joints]) => {
        if (joints.length >= 2) {
            console.log(`🤝 Found ${joints.length} joints in group '${base}':`, joints)
            // Add all rotation axes for these joints
            joints.forEach(joint => {
                const jointChannels = channels.filter(channel => 
                    channel.startsWith(joint + '_') && channel.includes('rotation')
                )
                interlimbVars.push(...jointChannels)
            })
        }
    })

    const uniqueVars = [...new Set(interlimbVars)]
    console.log('🤝 Interlimb variables found:', uniqueVars.length)
    return uniqueVars
}

/**
 * Identifies variables that exhibit Intralimb Mediation
 * Uses dynamic chain detection based on actual variable names
 */
export const getIntralimbVariables = (channels) => {
    const serial = []
    const nonSerial = []
    
    // Extract all unique joint base names
    const jointBaseNames = [...new Set(channels.map(channel => 
        channel.replace(/_(X|Y|Z)?rotation$/, '')
    ))]
    
    // Detect potential limb chains based on naming patterns
    const limbChains = []
    
    // Look for chains of joints that might form limbs
    jointBaseNames.forEach(jointName => {
        // Try to find related joints by looking for common patterns
        const relatedJoints = jointBaseNames.filter(otherJoint => {
            if (otherJoint === jointName) return false
            
            // Check if joints share common prefixes or are part of same anatomical structure
            const joint1 = jointName.toLowerCase()
            const joint2 = otherJoint.toLowerCase()
            
            // Look for common prefixes (e.g., "Left", "Right")
            const prefix1 = joint1.match(/^(left|right|upper|lower)/)
            const prefix2 = joint2.match(/^(left|right|upper|lower)/)
            
            if (prefix1 && prefix2 && prefix1[1] === prefix2[1]) {
                // Same side, check if they might be connected
                const base1 = joint1.replace(/^(left|right|upper|lower)/, '')
                const base2 = joint2.replace(/^(left|right|upper|lower)/, '')
                
                // Look for anatomical connections - more flexible matching
                const connections = [
                    ['hip', 'knee'], ['knee', 'ankle'], ['ankle', 'foot'],
                    ['shoulder', 'elbow'], ['elbow', 'wrist'], ['wrist', 'hand'],
                    ['hip', 'spine'], ['spine', 'neck'], ['neck', 'head'],
                    ['pelvis', 'hip'], ['thigh', 'knee'], ['shin', 'ankle'],
                    ['upperarm', 'elbow'], ['forearm', 'wrist']
                ]
                
                // More flexible matching - check if any part of the joint name matches
                // Also handle common BVH prefixes like 'hipx_', 'left_', 'right_', etc.
                const cleanBase1 = base1.replace(/^(hipx_|left_|right_|upper_|lower_)/, '')
                const cleanBase2 = base2.replace(/^(hipx_|left_|right_|upper_|lower_)/, '')
                
                return connections.some(([conn1, conn2]) => 
                    (cleanBase1.includes(conn1) || cleanBase1.includes(conn2)) &&
                    (cleanBase2.includes(conn1) || cleanBase2.includes(conn2)) &&
                    cleanBase1 !== cleanBase2
                )
            }
            
            return false
        })
        
        if (relatedJoints.length > 0) {
            const chain = [jointName, ...relatedJoints]
            if (chain.length >= 2) {
                console.log(`🔗 Found limb chain: ${chain.join(' -> ')}`)
                limbChains.push(chain)
            }
        }
    })
    
    // Process detected chains
    limbChains.forEach(chain => {
        // Get all rotation channels for this chain
        const chainChannels = chain.flatMap(joint => 
            channels.filter(channel => 
                channel.startsWith(joint + '_') && channel.includes('rotation')
            )
        )
        
        if (chainChannels.length >= 2) {
            // Add to serial (neighboring joints)
            serial.push(...chainChannels)
            
            // Add to non-serial (non-neighboring joints) if we have 3+ joints
            if (chainChannels.length >= 3) {
                nonSerial.push(...chainChannels)
            }
        }
    })

    console.log('🔗 Intralimb variables found - Serial:', serial.length, 'Non-Serial:', nonSerial.length)
    return {
        serial: [...new Set(serial)],
        nonSerial: [...new Set(nonSerial)]
    }
}

/**
 * Get GOM summary statistics for all categories
 */
export const getGOMSummary = (channels) => {
    const intrajoint = getIntrajointVariables(channels)
    const transitioning = getTransitioningVariables(channels)
    const interlimb = getInterlimbVariables(channels)
    const intralimb = getIntralimbVariables(channels)

    return {
        total: channels.length,
        intrajoint: intrajoint.length,
        transitioning: transitioning.length,
        interlimb: interlimb.length,
        'intralimb-serial': intralimb.serial.length,
        'intralimb-nonserial': intralimb.nonSerial.length
    }
}

/**
 * Get variables for a specific assumption by name (for debugging)
 */
export const getVariablesByAssumptionName = (channels, assumptionName) => {
    const assumptionMap = {
        'GOM': () => channels,
        'Transitioning': () => getTransitioningVariables(channels),
        'Intra-joint association': () => getIntrajointVariables(channels),
        'Inter-limb synergy': () => getInterlimbVariables(channels),
        'Serial intra-limb mediation': () => getIntralimbVariables(channels).serial,
        'Non-serial intra-limb mediation': () => getIntralimbVariables(channels).nonSerial,
        'All assumptions statistics': () => channels
    }

    const selector = assumptionMap[assumptionName]
    if (selector) {
        return selector()
    }
    
    console.warn('⚠️ Unknown assumption name:', assumptionName)
    return channels
}
