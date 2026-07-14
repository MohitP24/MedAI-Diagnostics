# Contributing to MedAI Diagnostics

Thank you for contributing to this project. This guide covers the workflow for the two primary contributors.

---

## Branching Strategy

We use a simple **GitHub Flow**:

- `main` - Production-ready, always deployable. Direct commits are **not allowed**.
- `dev` - Integration branch. Merge feature branches here first.
- `feature/<name>` - All new work goes in a feature branch (e.g., `feature/add-dashboard`).
- `fix/<name>` - For bug fixes (e.g., `fix/inference-timeout`).

### Workflow

```bash
# 1. Always branch off from dev
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# 2. Make your changes, commit often
git add .
git commit -m "feat: add user dashboard with scan history"

# 3. Push and open a Pull Request to dev
git push origin feature/your-feature-name

# 4. Both contributors review before merging.
# 5. When dev is stable, merge dev -> main with a version tag.
```

---

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

| Prefix | Use case |
|--------|----------|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `refactor:` | Code change that neither adds a feature nor fixes a bug |
| `docs:` | Documentation changes only |
| `style:` | Formatting, missing semi-colons, etc. |
| `chore:` | Build process, dependency updates |

**Example:** `feat: implement JWT authentication and protected routes`

---

## Project Structure

```
SE_Project/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Node.js + Express API
├── model_inference/   # Python Flask ML server
├── models/            # .keras model files (gitignored, not in repo)
├── docs/              # Project documentation
├── DEPLOYMENT_GUIDE.md
└── README.md
```

---

## Running Locally

See the Quick Start section in the [README.md](./README.md).

---

## Key Rules

1. **Never commit model files** (`.keras`, `.pth`, `.onnx`). They are gitignored and should be stored on Hugging Face.
2. **Never commit `.env` files**. Use `.env.example` as a template.
3. All Pull Requests need **at least one review** from the other contributor before merging.
4. Run the project end-to-end and verify it works before opening a PR.
