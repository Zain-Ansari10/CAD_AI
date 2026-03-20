# 🎨 AI-Powered CAD Generator

> Transform natural language into 3D-printable models using AI

An intelligent web-based CAD tool that generates 3D models from simple text descriptions. Built with FastAPI, CadQuery, and OpenAI's GPT-4.

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![CadQuery](https://img.shields.io/badge/CadQuery-2.x-orange.svg)](https://cadquery.readthedocs.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-purple.svg)](https://openai.com/)

---

## ✨ Features

- 🗣️ **Natural Language Input** - Describe models in plain English
- 🧠 **Two-Stage AI Pipeline** - Intent classification + specialized code generation
- 📐 **7 Pre-Built Templates** - Baseball bats, brackets, gears, boxes, cylinders, bottles, phone stands
- ⚙️ **CadQuery Execution** - Automatic 3D geometry generation
- 📦 **STL Export** - Ready for 3D printing
- 🎯 **Smart Defaults** - Infers reasonable dimensions when not specified
- 🔄 **Fallback Support** - Handles custom/unknown shapes

---

## 🚀 Quick Start

### Prerequisites

```bash
Python 3.11+
MongoDB (for user data)
OpenAI API Key
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-cad-generator.git
cd ai-cad-generator
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
# Create .env file
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=your_mongodb_connection_string
```

4. **Run the server**
```bash
uvicorn main:app --reload
```

5. **Open your browser**
```
http://localhost:8000
```

---

## 🎯 Usage Examples

### Simple Prompts

```python
"create a baseball bat"
"make an L bracket"
"design a gear with 10 teeth"
"box 50x50x20mm"
```

### Detailed Prompts

```python
"Design an L-shaped bracket: 50mm vertical arm, 40mm horizontal arm, 
 both 5mm thick and 30mm wide, with mounting holes 8mm diameter"

"Create a baseball bat 850mm long with 65mm barrel diameter"

"Make a gear: 40mm diameter, 10mm tall, 8 rectangular teeth"
```

### Custom Shapes

```python
"create a phone stand with 70 degree angle"
"make a bottle 200mm tall"
"design a hollow cylinder 100mm long, 30mm diameter"
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INPUT                            │
│         "create a baseball bat 850mm long"               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              STAGE 1: Intent Classifier                  │
│  ┌────────────────────────────────────────────────┐     │
│  │  LLM analyzes prompt                           │     │
│  │  Returns: {                                    │     │
│  │    "object_type": "baseball_bat",              │     │
│  │    "parameters": {"length": 850},              │     │
│  │    "complexity": "complex"                     │     │
│  │  }                                             │     │
│  └────────────────────────────────────────────────┘     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           STAGE 2: Code Generator                        │
│  ┌────────────────────────────────────────────────┐     │
│  │  Selects "baseball_bat" template               │     │
│  │  LLM generates CadQuery code:                  │     │
│  │                                                │     │
│  │  barrel = cq.Workplane("XY")...                │     │
│  │  taper = ...                                   │     │
│  │  handle = ...                                  │     │
│  │  knob = ...                                    │     │
│  │  result = barrel.union(taper)...               │     │
│  └────────────────────────────────────────────────┘     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CAD Service Execution                       │
│  ┌────────────────────────────────────────────────┐     │
│  │  exec(generated_code)                          │     │
│  │  Creates 3D geometry                           │     │
│  │  Exports to STL file                           │     │
│  └────────────────────────────────────────────────┘     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ baseball_bat │
              │  .stl file   │
              └──────────────┘
```

---

## 📂 Project Structure

```
ai-cad-generator/
│
├── backend/
│   ├── services/
│   │   ├── llm_service.py       # 🧠 Two-stage AI pipeline
│   │   │   ├── classify_intent()      # Stage 1: Intent classifier
│   │   │   ├── TEMPLATES              # Pre-built object templates
│   │   │   ├── generate_code_from_template()  # Stage 2: Code gen
│   │   │   └── clean_llm_response()   # Code cleanup
│   │   │
│   │   └── cad_service.py       # ⚙️ CadQuery execution
│   │       └── run_code_and_export()  # Execute & export STL
│   │
│   ├── config/
│   │   └── settings.py          # 🔑 Configuration
│   │
│   ├── stls/                    # 📦 Generated STL files
│   │
│   └── main.py                  # 🚀 FastAPI application
│
├── frontend/                    # 🎨 React UI (optional)
│
├── requirements.txt             # 📚 Python dependencies
├── .env                         # 🔐 Environment variables
└── README.md                    # 📖 Documentation
```

---

## 🧠 Two-Stage AI Pipeline

### Stage 1: Intent Classification

The first LLM call identifies **what** the user wants to create:

**Input:** `"create a baseball bat 850mm long"`

**Output:**
```json
{
  "object_type": "baseball_bat",
  "parameters": {
    "length": 850
  },
  "complexity": "complex"
}
```

### Stage 2: Code Generation

Based on the identified object type, the system:

1. **Selects appropriate template** (if available)
2. **Uses specialized prompt** for that object type
3. **Generates clean CadQuery code**

**Templates Available:**
- ⚾ `baseball_bat` - Multi-segment tapered design
- 🔧 `bracket` - L-shaped with mounting holes
- ⚙️ `gear` - Circular pattern of teeth
- 📦 `box` - Rectangular with optional features
- 🔴 `cylinder` - Solid or hollow tubes
- 🍾 `bottle` - Body + neck + cap
- 📱 `phone_stand` - Angled stand design
- 🎨 `custom` - Fallback for unknown shapes

---

## 🔧 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend Framework** | FastAPI | REST API server |
| **CAD Engine** | CadQuery | 3D geometry generation |
| **AI Model** | OpenAI GPT-4o-mini | Code generation |
| **Database** | MongoDB | User data & model history |
| **3D Export** | STL Format | 3D printing compatibility |
| **Language** | Python 3.11 | Core application |

---

## 📋 API Endpoints

### Generate 3D Model

```http
POST /cad/generate
Content-Type: application/json

{
  "prompt": "create a baseball bat 850mm long"
}
```

**Response:**
```json
{
  "filepath": "stls/abc-123-def.stl",
  "code": "barrel = cq.Workplane...",
  "status": "success"
}
```

### Download STL File

```http
GET /cad/download/{filename}
```

---

## 🎯 Supported Object Types

| Object | Example Prompt | Complexity |
|--------|---------------|------------|
| Baseball Bat | `create a baseball bat` | Complex (4 segments) |
| L-Bracket | `make a mounting bracket 50mm` | Medium (2 parts + holes) |
| Gear | `design a gear with 8 teeth` | Medium (circular pattern) |
| Box | `box 60x40x20mm with rounded edges` | Simple |
| Cylinder | `make a hollow pipe 100mm long` | Simple |
| Bottle | `create a water bottle 300mm tall` | Complex (4 segments) |
| Phone Stand | `design a phone holder` | Medium (angled design) |

---

## 🛠️ Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...              # OpenAI API key
MONGODB_URI=mongodb://...          # MongoDB connection string

# Optional
STL_OUTPUT_DIR=stls                # Output directory for STL files
LLM_MODEL=gpt-4o-mini              # OpenAI model to use
LLM_TEMPERATURE=0.1                # Model temperature (0.0-1.0)
LLM_MAX_TOKENS=1500                # Maximum response tokens
```

---

## 🧪 Testing

```bash
# Test with simple prompt
curl -X POST http://localhost:8000/cad/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "create a box 50x50x50mm"}'

# Test with complex prompt
curl -X POST http://localhost:8000/cad/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Design an L-shaped bracket: 50mm vertical, 40mm horizontal, 5mm thick"}'
```

---

## 🔍 How It Works

### Example: Creating a Baseball Bat

1️⃣ **User Input**
```
"create a baseball bat 850mm long"
```

2️⃣ **Intent Classification** (LLM Call #1)
```json
{
  "object_type": "baseball_bat",
  "parameters": {"length": 850}
}
```

3️⃣ **Template Selection**
```python
# System selects baseball_bat template
TEMPLATES["baseball_bat"]["system_prompt"]
```

4️⃣ **Code Generation** (LLM Call #2)
```python
barrel = cq.Workplane("XY").circle(32.5).extrude(200)
taper = cq.Workplane("XY").workplane(offset=200).circle(32.5).workplane(offset=425).circle(12.5).loft()
handle = cq.Workplane("XY").workplane(offset=625).circle(12.5).extrude(175)
knob = cq.Workplane("XY").workplane(offset=800).circle(17.5).extrude(50)
result = barrel.union(taper).union(handle).union(knob)
```

5️⃣ **Execution & Export**
```python
exec(code)  # Creates 3D geometry
result.val().exportStl("bat.stl")  # Exports to file
```

6️⃣ **Download STL**
```
User receives 3D-printable baseball_bat.stl file
```

---

## 🚧 Limitations

- **Complex Organic Shapes** - Better suited for mechanical/geometric objects
- **Dimension Ambiguity** - Works best when dimensions are specified
- **LLM Variability** - May require multiple attempts for complex custom shapes
- **STL Only** - Currently only exports STL format (no STEP/IGES)

---

## 🗺️ Roadmap

- [ ] Add more templates (screws, nuts, bolts, enclosures)
- [ ] Iterative editing ("make the handle thinner")
- [ ] Parametric editor with sliders
- [ ] STEP/IGES export support
- [ ] User accounts and model library
- [ ] Model search and sharing
- [ ] Material/color visualization
- [ ] 3D printing cost estimation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Templates

To add a new object template:

1. Open `backend/services/llm_service.py`
2. Add your template to the `TEMPLATES` dictionary:

```python
"your_object": {
    "system_prompt": (
        "Generate CadQuery code for your object...\n\n"
        "CRITICAL RULES:\n"
        "- cq module is already imported\n"
        "- Do NOT add imports or comments\n\n"
        "Template code:\n"
        "result = cq.Workplane('XY')...\n"
    )
}
```

3. Update the classifier to recognize your object type
4. Test thoroughly

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [CadQuery](https://cadquery.readthedocs.io/) - Python-based CAD library
- [OpenAI](https://openai.com/) - GPT-4 language model
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- All contributors and users of this project

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with ❤️ using AI and CadQuery**
