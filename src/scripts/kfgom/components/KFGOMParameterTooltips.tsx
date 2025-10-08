import { createSignal, Show } from "solid-js"
import { Target, Settings, Clock, TrendingUp, Filter, RefreshCw } from "lucide-solid"

interface KFGOMParameterTooltipsProps {
    children: any
    parameter: "target" | "method" | "lags" | "steps" | "filter" | "retrain"
}

export default function KFGOMParameterTooltips(props: KFGOMParameterTooltipsProps) {
    const [isVisible, setIsVisible] = createSignal(false)
    const [tooltipPosition, setTooltipPosition] = createSignal({ top: 0, left: 0 })

    const calculatePosition = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
        
        return {
            top: rect.top + scrollTop - 8, // 8px au-dessus de l'élément (plus proche)
            left: rect.left + scrollLeft + (rect.width / 2) // Centré horizontalement
        }
    }

    const handleMouseEnter = (event: MouseEvent) => {
        const element = event.currentTarget as HTMLElement
        const position = calculatePosition(element)
        setTooltipPosition(position)
        setIsVisible(true)
    }

    const getTooltipContent = () => {
        const getIcon = () => {
            switch (props.parameter) {
                case "target":
                    return <Target size={16} style={{ "margin-right": "6px", color: "#3b82f6" }} />
                case "method":
                    return <Settings size={16} style={{ "margin-right": "6px", color: "#10b981" }} />
                case "lags":
                    return <Clock size={16} style={{ "margin-right": "6px", color: "#f59e0b" }} />
                case "steps":
                    return <TrendingUp size={16} style={{ "margin-right": "6px", color: "#8b5cf6" }} />
                case "filter":
                    return <Filter size={16} style={{ "margin-right": "6px", color: "#ef4444" }} />
                case "retrain":
                    return <RefreshCw size={16} style={{ "margin-right": "6px", color: "#06b6d4" }} />
                default:
                    return null
            }
        }

        const getTitle = () => {
            switch (props.parameter) {
                case "target":
                    return "Target Joint & Axis"
                case "method":
                    return "Regression Method"
                case "lags":
                    return "Number of Lags (Time Delays)"
                case "steps":
                    return "Prediction Steps (Forecast Steps)"
                case "filter":
                    return "Data Filter"
                case "retrain":
                    return "Model Retraining"
                default:
                    return "Parameter Information"
            }
        }

        const getDescription = () => {
            switch (props.parameter) {
                case "target":
                    return `Selects the joint and axis to analyze and predict.
• Joint: The body segment to study (e.g., Hips, RightArm, LeftLeg)
• Axis: The rotation axis (X, Y, Z)
The model will predict movements of this specific joint using other joints as explanatory variables.`

                case "method":
                    return `Chooses the machine learning algorithm:
• OLS (Ordinary Least Squares): Classic linear regression
• Ridge: Regression with L2 regularization (prevents overfitting)
• MLE (Maximum Likelihood Estimation): Maximum likelihood estimation
Ridge is recommended to avoid overfitting with many variables.`

                case "lags":
                    return `Defines how many previous time steps to use for prediction.
• Minimum: 2 (recommended)
• More lags = more temporal information
• Too many lags = risk of overfitting
Example: Lags=2 uses data from the 2 previous frames to predict the current frame.`

                case "steps":
                    return `Number of future frames to predict.
• None: No future prediction (analysis only)
• 1-10: Predicts the next N frames
• More steps = longer-term prediction but less accurate
Useful for analyzing the model's predictive capacity over the long term.`

                case "filter":
                    return `Filtering criteria for explanatory variables:
• All: Uses all available variables
• Significance: Filters by statistical significance
• GOM Assumptions: Applies GOM analysis assumptions
Filtering improves model quality by eliminating irrelevant variables.`

                case "retrain":
                    return `Retrains the model with new parameters or data.
• Preserves training history
• Allows comparing different configurations
• Improves performance by adjusting parameters
Useful for optimizing parameters and comparing different approaches.`

                default:
                    return "Parameter information"
            }
        }

        return (
            <div style={{ display: "flex", "flex-direction": "column", gap: "4px", "text-align": "left" }}>
                <div style={{ display: "flex", "align-items": "center", "font-weight": "bold", "font-size": "13px", color: "#3b82f6" }}>
                    {getIcon()}
                    {getTitle()}
                </div>
                <div style={{ "font-size": "12px", "line-height": "1.3" }}>
                    {getDescription()}
                </div>
            </div>
        )
    }


    return (
        <div 
            style={{ 
                position: "relative", 
                display: "inline-flex", 
                "align-items": "center",
                cursor: "help"
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVisible(false)}
        >
            {props.children}

            <Show when={isVisible()}>
                <div style={{
                    position: "fixed",
                    top: `${tooltipPosition().top}px`,
                    left: `${tooltipPosition().left}px`,
                    transform: isVisible() ? "translateX(-50%) translateY(-100%) scale(1)" : "translateX(-50%) translateY(-100%) scale(0.95)",
                    "background-color": "white",
                    color: "black",
                    padding: "12px 16px",
                    "border-radius": "8px",
                    "border": "1px solid #e5e7eb",
                    "font-size": "12px",
                    "line-height": "1.5",
                    "max-width": "400px",
                    "min-width": "300px",
                    "white-space": "pre-wrap",
                    "word-wrap": "break-word",
                    "box-shadow": "0 8px 16px -4px rgba(0, 0, 0, 0.2), 0 4px 8px -2px rgba(0, 0, 0, 0.1)",
                    "z-index": "999999",
                    opacity: isVisible() ? 1 : 0,
                    transition: "all 0.2s ease-in-out",
                    "pointer-events": "none"
                }}>
                    {getTooltipContent()}

                    {/* Arrow */}
                    <div style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        "margin-left": "-4px",
                        width: "0",
                        height: "0",
                        "border-left": "4px solid transparent",
                        "border-right": "4px solid transparent",
                        "border-top": "4px solid white"
                    }} />
                </div>
            </Show>
        </div>
    )
}
