// BVH Parser for SARIMAX Analysis - Using predefined 19 joints
// Predefined joint list: 19 joints × 3 axes = 57 channels
export const PREDEFINED_JOINTS = [
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
    "RightLeg"
]

// Predefined axes
export const PREDEFINED_AXES = ["Xrotation", "Yrotation", "Zrotation"]

// Generate ALL_BVH_ANGLES from predefined joints and axes
export let ALL_BVH_ANGLES = [] // added by youssef hergal

// Function to initialize ALL_BVH_ANGLES with predefined joints
export function initializePredefinedAngles() { // added by youssef hergal
    ALL_BVH_ANGLES = []
    PREDEFINED_JOINTS.forEach(joint => {
        PREDEFINED_AXES.forEach(axis => {
            ALL_BVH_ANGLES.push(`${joint}_${axis}`)
        })
    })
    console.log('🔄 Initialized ALL_BVH_ANGLES with', ALL_BVH_ANGLES.length, 'predefined channels')
    console.log('📋 Predefined channels:', ALL_BVH_ANGLES.slice(0, 10), '...')
}

export function prepareForSARIMAX(bvhData, targetAngle, exogAngles) {
    try {
        if (!bvhData || !bvhData.motionData || !bvhData.channels) {
            throw new Error('Invalid BVH data structure')
        }

        const { motionData, channels, frameCount } = bvhData
        
        // Find target angle index
        const targetIndex = channels.findIndex(channel => channel === targetAngle)
        if (targetIndex === -1) {
            throw new Error(`Target angle ${targetAngle} not found in BVH channels`)
        }

        // Find exogenous angles indices
        const exogIndices = exogAngles.map(angle => {
            const index = channels.findIndex(channel => channel === angle)
            if (index === -1) {
                console.warn(`Exogenous angle ${angle} not found in BVH channels`)
                return null
            }
            return index
        }).filter(index => index !== null)

        if (exogIndices.length === 0) {
            throw new Error('No valid exogenous angles found')
        }

        // Extract endogenous (target) data
        const endog = motionData.map(frame => frame[targetIndex])

        // Extract exogenous data
        const exog = motionData.map(frame => 
            exogIndices.map(index => frame[index])
        )

        console.log('📊 SARIMAX Data Preparation:', {
            targetAngle,
            targetIndex,
            exogAngles: exogAngles.length,
            exogIndices: exogIndices.length,
            frameCount,
            endogLength: endog.length,
            exogLength: exog.length,
            exogSample: exog[0]?.slice(0, 3) || []
        })

        return {
            endog,
            exog,
            frameCount,
            targetIndex,
            exogIndices,
            channels: [targetAngle, ...exogAngles.filter((_, i) => exogIndices[i] !== null)]
        }

    } catch (error) {
        console.error('Error preparing SARIMAX data:', error)
        throw error
    }
}

// Use existing BVH data from main project but filter to predefined joints only
export function extractBVHDataFromScene(sceneResult) {
    try {
        console.log('🔍 Extracting BVH data for predefined joints:', {
            hasSceneResult: !!sceneResult,
            hasBvhBones: !!sceneResult?.bvhBones,
            bvhBonesLength: sceneResult?.bvhBones?.length || 0
        })
        
        if (!sceneResult || !sceneResult.bvhBones) {
            throw new Error('No BVH data found in scene result')
        }

        const bvhBones = sceneResult.bvhBones
        
        // Initialize predefined angles
        initializePredefinedAngles() // added by youssef hergal
        
        // Extract channels and motion data for predefined joints only
        const channels = []
        const motionData = []
        let frameCount = 0

        // Get frame count from first bone
        if (bvhBones.length > 0 && bvhBones[0].frames && bvhBones[0].frames.length > 0) {
            frameCount = bvhBones[0].frames.length
        }
        
        // Extract channels for predefined joints only
        bvhBones.forEach(bone => {
            if (bone.channels && bone.type !== 'ENDSITE' && PREDEFINED_JOINTS.includes(bone.name)) {
                bone.channels.forEach(channel => {
                    const channelName = `${bone.name}_${channel}`
                    if (ALL_BVH_ANGLES.includes(channelName) && !channels.includes(channelName)) {
                        channels.push(channelName)
                    }
                })
            }
        })

        // Extract motion data for each frame (only predefined joints)
        for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
            const frameData = []
            
            bvhBones.forEach(bone => {
                if (bone.frames && bone.frames[frameIndex] && bone.type !== 'ENDSITE' && PREDEFINED_JOINTS.includes(bone.name)) {
                    const frame = bone.frames[frameIndex]
                    
                    // Extract rotation values using existing rawRotation structure
                    bone.channels.forEach(channel => {
                        const channelName = `${bone.name}_${channel}`
                        if (ALL_BVH_ANGLES.includes(channelName)) {
                            let value = 0
                            switch (channel) {
                                case 'Xrotation':
                                    value = frame.rawRotation?.Xrotation || 0
                                    break
                                case 'Yrotation':
                                    value = frame.rawRotation?.Yrotation || 0
                                    break
                                case 'Zrotation':
                                    value = frame.rawRotation?.Zrotation || 0
                                    break
                                case 'Xposition':
                                    value = frame.position?.x || 0
                                    break
                                case 'Yposition':
                                    value = frame.position?.y || 0
                                    break
                                case 'Zposition':
                                    value = frame.position?.z || 0
                                    break
                                default:
                                    value = 0
                            }
                            frameData.push(value)
                        }
                    })
                }
            })
            
            motionData.push(frameData)
        }

        const bvhData = {
            channels,
            motionData,
            frameCount
        }

        console.log('📊 Extracted BVH Data for predefined joints:', {
            frameCount: bvhData.frameCount,
            channels: bvhData.channels.length,
            sampleChannels: bvhData.channels.slice(0, 5),
            sampleMotionData: bvhData.motionData[0]?.slice(0, 5) || [],
            allChannels: bvhData.channels
        })

        return bvhData

    } catch (error) {
        console.error('Error extracting BVH data from scene:', error)
        throw error
    }
} 