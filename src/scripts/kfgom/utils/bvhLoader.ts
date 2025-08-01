import { BVHLoader } from "../../../../build/BVHLoader.js"      

// Independent BVH loader for KF-GOM analysis
class KFGOMBVHLoader {
    private loader: BVHLoader

    constructor() {
        this.loader = new BVHLoader()
    }

    // Load BVH file independently without affecting the main scene
    async loadBVHFile(filePath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.loader.load(
                filePath,
                (result) => {
                    console.log(`✅ KF-GOM BVH loaded: ${filePath} with ${result.bvhBones?.length || 0} bones`)
                    resolve(result)
                },
                undefined,
                (error) => {
                    console.error(`❌ KF-GOM BVH load failed: ${filePath}`, error)
                    reject(error)
                }
            )
        })
    }

    // Extract only the bones data needed for KF-GOM analysis
    extractBonesData(bvhResult: any): any[] {
        if (!bvhResult || !bvhResult.bvhBones) {
            console.warn("No BVH bones data found in result")
            return []
        }

        // Return only the bones data without affecting the global scene
        return bvhResult.bvhBones
    }

    // Validate BVH file structure
    validateBVHStructure(bvhResult: any): boolean {
        if (!bvhResult) {
            console.error("BVH result is null or undefined")
            return false
        }

        if (!bvhResult.bvhBones || !Array.isArray(bvhResult.bvhBones)) {
            console.error("BVH bones data is missing or invalid")
            return false
        }

        if (bvhResult.bvhBones.length === 0) {
            console.error("BVH file contains no bones")
            return false
        }

        // Check if bones have the required structure
        const firstBone = bvhResult.bvhBones[0]
        if (!firstBone || !firstBone.name || !firstBone.frames) {
            console.error("BVH bones structure is invalid")
            return false
        }

        console.log(`✅ BVH structure validated: ${bvhResult.bvhBones.length} bones`)
        return true
    }
}

// Create and export a singleton instance
export const kfgomBVHLoader = new KFGOMBVHLoader() 