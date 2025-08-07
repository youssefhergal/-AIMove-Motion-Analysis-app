// BVH Parser utilities for SARIMAX analysis
// Automatically extract rotation channels from BVH data instead of using hardcoded list

// Function to extract all rotation channels from BVH data
export function extractRotationChannels(bvhData) {
    if (!bvhData || !bvhData.channels) {
        throw new Error('Invalid BVH data: missing channels information')
    }
    
    // Filter channels to get only rotation channels (ending with _Xrotation, _Yrotation, _Zrotation)
    const rotationChannels = bvhData.channels.filter(channel => 
        channel.endsWith('_Xrotation') || 
        channel.endsWith('_Yrotation') || 
        channel.endsWith('_Zrotation')
    )
    
    console.log('📊 Extracted rotation channels:', {
        totalChannels: bvhData.channels.length,
        rotationChannels: rotationChannels.length,
        sampleChannels: rotationChannels.slice(0, 10)
    })
    
    return rotationChannels
}

// Function to get all BVH angles from the actual data
export function getAllBVHAngles(bvhData) {
    return extractRotationChannels(bvhData)
}

export function prepareForSARIMAX(bvhData, targetAngle, exogAngles) {
    if (!bvhData || !bvhData.channels || !bvhData.motionData) {
        throw new Error('Invalid BVH data structure')
    }

    const { channels, motionData } = bvhData
    
    // Find target angle index
    const targetIndex = channels.findIndex(channel => channel === targetAngle)
    if (targetIndex === -1) {
        throw new Error(`Target angle ${targetAngle} not found in BVH channels`)
    }

    // Extract endogenous (target) data
    const endog = motionData.map(frame => frame[targetIndex])

    // Extract exogenous data indices
    const exogIndices = exogAngles.map(angle => {
        return channels.findIndex(channel => channel === angle)
    }).filter(index => index !== -1)

    // Extract exogenous data
    const exog = exogIndices.map(index => 
        motionData.map(frame => frame[index])
    )

    console.log('📊 SARIMAX data preparation:', {
        targetAngle,
        endogLength: endog.length,
        exogLength: exog.length,
        exogIndicesCount: exogIndices.length,
        frameCount: motionData.length,
        channels: channels.length
    })

    return { 
        endog, 
        exog, 
        frameCount: motionData.length,
        channels: channels.length
    }
} 