/**
 * Bone Hierarchy Utilities
 * 
 * Centralized utilities for bone hierarchy processing
 * to avoid code duplication across components.
 */

/**
 * Clean bone hierarchy by removing special characters
 * @param {string} boneHierarchy - The bone hierarchy string to clean
 * @returns {Array} Array containing the cleaned bone name
 */
export function cleanBoneHierarchy(boneHierarchy) {
    if (typeof boneHierarchy !== "string") {
        console.error("Expected a string but received:", boneHierarchy)
        return [""] // Return array with empty string for consistency
    }
    // Remove all special characters except underscore and spaces
    return [boneHierarchy].map((name) => name.replace(/[^a-zA-Z0-9_\s]/g, ""))
}

/**
 * Extract joint name from formatted hierarchy string
 * @param {string} formattedBone - The formatted bone string with hierarchy
 * @returns {string} The clean joint name without hierarchy characters
 */
export function extractJointName(formattedBone) {
    if (typeof formattedBone !== "string") {
        console.error("Expected a string but received:", formattedBone)
        return ""
    }
    // Remove hierarchy characters (•, -, spaces) and get the actual joint name
    return formattedBone.replace(/[•\-]+/g, "").trim()
}

/**
 * Extract joint names from variables array
 * @param {Array} variables - Array of variable names
 * @returns {Array} Array of joint names that match predefined joint patterns
 */
export function extractJointNames(variables) {
    const jointNames = [
        "Spine",
        "Spine1", 
        "Spine2",
        "Spine3",
        "Hips",
        "Neck",
        "Head",
        "LeftArm",
        "LeftForeArm",
        "RightArm",
        "RightForeArm",
        "LeftShoulder",
        "LeftShoulder2",
        "RightShoulder",
        "RightShoulder2",
        "LeftUpLeg",
        "LeftLeg",
        "RightUpLeg",
        "RightLeg",
    ]

    return variables.filter((variable) =>
        jointNames.some((joint) => variable.includes(joint))
    )
}

/**
 * Format bone names for display with indentation
 * @param {Array} bones - Array of bone objects with depth property
 * @returns {Array} Array of formatted bone names with indentation
 */
export function formatBoneNames(bones) {
    if (!Array.isArray(bones)) {
        return []
    }
    return bones.map((bone) => {
        const level = bone.depth // Assume each bone object has a 'depth' property
        
        // Create simple dash-based indentation
        let prefix = ""
        if (level === 0) {
            prefix = "•" // Root level - bullet point
        } else {
            // Use simple dashes for indentation
            prefix = "•" + "-".repeat(level * 1) // 1 dashes per level
        }
        
        return `${prefix}${bone.name}` // Return formatted name with hierarchy
    })
}
