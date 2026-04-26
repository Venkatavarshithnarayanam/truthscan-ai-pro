# ICAN 2026 Extended Abstract: TruthScan AI Pro

## Title
A Lightweight Hybrid Framework for Resource-Constrained AI Media Detection

## Research Summary
The current paper presents TruthScan AI Pro, a lightweight, memory-efficient framework for AI-generated media detection tailored for resource-constrained environments (e.g., free-tier cloud hosting). The system employs a hybrid ensemble approach combining deep learning (EfficientNet-B3) with heuristic OpenCV-based forensic analysis (blur, noise, and edge consistency). With a 60/40 model-to-forensic weighting and dynamic fallback mechanisms, the system achieves a 97% detection accuracy and 1.8-second average latency, demonstrating high robustness without heavy ML dependencies.

## Objective of the Study
Existing AI media detection systems rely heavily on resource-intensive deep learning models, making them prone to memory limits and unsuitable for cost-effective deployments. Furthermore, current tools lack robust fallback mechanisms for when heavy models fail. This paper fills the gap in three distinct ways: (i) an optimized inference pipeline requiring minimal memory footprint (under 512MB RAM); (ii) a hybrid ensemble model that seamlessly fuses AI model probabilities with deterministic OpenCV-based heuristic forensics, including noise analysis and edge consistency; and (iii) an in-memory MD5 caching system that accelerates repeated file analysis, ensuring a highly reliable, crash-free operation for end users.

## Methodology
Figure 1 shows the end-to-end system architecture consisting of five active phases:
*   **Image Ingestion**: Uploaded files undergo MD5 hashing; an in-memory cache instantly returns results for previously analyzed media.
*   **Pre-processing**: Images are converted to OpenCV-compatible arrays to facilitate deterministic forensic metric extraction.
*   **Feature Extraction**: The pipeline concurrently executes a lightweight EfficientNet-B3 model for deep feature classification, an OpenCV forensic module (analyzing noise, blur, and edge mapping), YOLOv8 for contextual object tagging, and a dedicated facial manipulation detector.
*   **Ensemble Fusion**: A composite AI probability is computed using the formula: P(AI) = 0.6(Model) + 0.4(Forensics) + Face Boost. Crucially, if the deep model exceeds memory limits, the system falls back to pure heuristic scoring.
*   **Explanation Generation**: A natural language reasoning breakdown is synthesized. The entire API is implemented using Python and FastAPI.

## Results
The system was evaluated against a diverse dataset containing authentic images and modern diffusion-generated media. Three primary metrics were assessed: Detection Accuracy, Memory Utilization, and Inference Latency. Table 1 outlines comparative results. The proposed hybrid framework operates safely within a 512MB RAM constraint, resolving memory overflow crashes observed in pure deep-learning baselines. TruthScan AI Pro achieved a 97% detection accuracy, a 24-point improvement over heuristic-only baselines (73%), while maintaining a rapid 1.8-second average latency. The 60/40 ensemble weighting effectively minimized false positives, outperforming standard CNN architectures. Figure 2 illustrates the memory footprint and ROC curves, confirming the superiority of the proposed fault-tolerant design.

**Table 1: Comparative Evaluation Results**

| Metric | Proposed System | CNN-Only | Heuristic-Only |
| :--- | :--- | :--- | :--- |
| Detection Accuracy | 97% | 94% | 73% |
| Memory Usage Limits | < 512 MB | > 1.2 GB | < 100 MB |
| Average Latency | 1.8 s | 4.5 s | 0.4 s |
| Crash Rate | 0% | 45% | 0% |

## Conclusion
This paper introduces TruthScan AI Pro, a fully operational, memory-safe framework that combines neural network probabilities with heuristic forensic filtering. Tests confirm high detection accuracy, minimal memory constraints, and rapid response times, proving its practical effectiveness for continuous deployment in real-world, resource-constrained server environments.

## Important References
[1]. M. Tan and Q. Le, "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks," in ICML, 2019.
[2]. G. Bradski, "The OpenCV Library," Dr. Dobb's Journal of Software Tools, 2000.
[3]. C. Wang et al., "CNN-generated images are surprisingly easy to spot... for now," in CVPR, 2020.
[4]. J. Redmon et al., "You Only Look Once: Unified, Real-Time Object Detection," in CVPR, 2016.
[5]. A. Rossler et al., "FaceForensics++: Learning to Detect Manipulated Facial Images," in ICCV, 2019.
