# Provenance Audit Report

## Frontend Hardcoded Values
- In `app/page.tsx`, the following values are hardcoded in the hero section and stat strip:
  - `Rank 1`
  - `NOV005`
  - `−6.913 kcal/mol`
  - `22 compounds screened`
  - `5 / 22 low-concern safety class`

## Data Comparison
| Compound | Raw Vina Score | App Vina Score | Vina Match | Raw MW | App MW | MW Match | Raw logP | App logP | logP Match | Raw Safety | App Safety | Safety Match |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| REF001 | -5.408 | -5.408 | yes | 128.083 | 128.011 | yes | -1.012 | -1.012 | yes | MODERATE_CONCERN | MODERATE_CONCERN | yes |
| REF002 | -5.898 | -5.898 | yes | 272.253 | 272.09 | no | -1.429 | -1.429 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| REF003 | -5.386 | -5.386 | yes | 110.112 | 110.037 | yes | 1.098 | 1.098 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| REF004 | -5.728 | -5.728 | yes | 122.123 | 122.037 | yes | 0.752 | 0.752 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| KA001 | -5.599 | -5.599 | yes | 160.100 | 160.017 | yes | -0.673 | -0.673 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| KA002 | -5.69 | -5.69 | yes | 176.555 | 175.988 | no | -0.404 | -0.404 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| KA003 | -5.868 | -5.868 | yes | 156.137 | 156.042 | yes | -0.375 | -0.375 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| KA004 | -4.898 | -4.898 | yes | 142.110 | 142.027 | yes | -0.357 | -0.357 | yes | MODERATE_CONCERN | MODERATE_CONCERN | yes |
| HQ001 | -5.547 | -5.547 | yes | 124.139 | 124.052 | yes | 1.401 | 1.401 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| HQ002 | -5.293 | -5.293 | yes | 110.112 | 110.037 | yes | 1.098 | 1.098 | yes | MODERATE_CONCERN | MODERATE_CONCERN | yes |
| HQ003 | -5.952 | -5.952 | yes | 166.220 | 166.099 | no | 2.395 | 2.395 | yes | MODERATE_CONCERN | MODERATE_CONCERN | yes |
| HQ004 | -5.609 | -5.609 | yes | 128.102 | 128.027 | yes | 1.237 | 1.237 | yes | MODERATE_CONCERN | MODERATE_CONCERN | yes |
| HQ005 | -5.908 | -5.908 | yes | 144.557 | 143.998 | no | 1.751 | 1.751 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| TL001 | -6.241 | -6.241 | yes | 136.150 | 136.052 | yes | 1.061 | 1.061 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| TL002 | -6.195 | -6.195 | yes | 156.568 | 155.998 | no | 1.406 | 1.406 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| TL003 | -6.131 | -6.131 | yes | 167.120 | 167.022 | yes | 0.661 | 0.661 | yes | MODERATE_CONCERN | MODERATE_CONCERN | yes |
| TL004 | -6.292 | -6.292 | yes | 164.204 | 164.084 | no | 1.876 | 1.876 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| NOV001 | -5.671 | -5.671 | yes | 244.246 | 244.074 | no | 2.679 | 2.679 | yes | MODERATE_CONCERN | MODERATE_CONCERN | yes |
| NOV002 | -5.554 | -5.554 | yes | 122.123 | 122.037 | yes | 1.205 | 1.205 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| NOV003 | -6.273 | -6.273 | yes | 180.159 | 180.042 | no | 1.196 | 1.196 | yes | MODERATE_CONCERN | MODERATE_CONCERN | yes |
| NOV004 | -5.838 | -5.838 | yes | 212.161 | 212.043 | no | -1.219 | -1.219 | yes | LOW_CONCERN | LOW_CONCERN | yes |
| NOV005 | -6.913 | -6.913 | yes | 181.147 | 181.038 | no | -0.129 | -0.129 | yes | LOW_CONCERN | LOW_CONCERN | yes |