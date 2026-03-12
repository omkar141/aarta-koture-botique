# Azure DevOps CI/CD Setup Guide (React + Node.js + MongoDB)

This guide is tailored to this repository (`client` + `server` npm workspaces) and explains how to go from zero setup to production deployment in Azure DevOps.

## 1. Current Project Facts (Used by Pipeline)

- Monorepo with npm workspaces at root (`client`, `server`)
- Frontend: React (`client`, build output: `client/build`)
- Backend: Express (`server/src/index.js`)
- Backend health endpoint: `GET /api/health`
- Required backend secrets:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRE`
- Current frontend API base URL is hardcoded in `client/src/services/api.js`

## 2. Architecture for Azure Deployment

Use this target architecture:

- Frontend: Azure Static Web App
- Backend API: Azure App Service (Linux, Node.js 20)
- Database: MongoDB Atlas
- CI/CD: Azure Pipelines (multi-stage YAML)

## 3. One-Time Prerequisites

### 3.1 Azure Resources

Create these resources in Azure:

1. Resource group: `rg-boutique-prod`
2. App Service Plan (Linux): `asp-boutique-prod`
3. Web App (API): `app-boutique-api-prod`
4. Static Web App (UI): `swa-boutique-ui-prod`
5. (Optional) Application Insights

### 3.2 Azure DevOps Project Setup

1. Create Azure DevOps project.
2. Import this repository.
3. Ensure default branch is `main`.
4. In `Project Settings > Repositories > Policies`, enable:
   - Minimum 1 reviewer
   - Build validation (later attach CI pipeline)
   - Comment resolution required

### 3.3 Service Connections

In `Project Settings > Service connections` create:

1. Azure Resource Manager service connection
   - Name: `sc-azure-boutique`
   - Scope: subscription or resource group (`rg-boutique-prod`)
2. (Optional) Separate service connection for non-prod subscription

## 4. Required Code Readiness Change

Before production CI/CD, make frontend API URL configurable.

Current file uses hardcoded localhost:
- `client/src/services/api.js`

Use this pattern instead:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

Why: Static frontend in Azure must call your deployed backend URL, not localhost.

## 5. Configure Azure App Settings

### 5.1 API Web App Settings

In Azure Portal > `app-boutique-api-prod` > Configuration, add:

- `NODE_ENV=production`
- `MONGO_URI=<your-atlas-connection-string>`
- `JWT_SECRET=<strong-secret>`
- `JWT_EXPIRE=24h`
- `SCM_DO_BUILD_DURING_DEPLOYMENT=true`

Notes:
- Do not set `PORT` manually for App Service.
- Save and restart app after changes.

### 5.2 Static Web App Settings

You can build frontend via pipeline task using environment variable:

- `REACT_APP_API_URL=https://app-boutique-api-prod.azurewebsites.net/api`

## 6. Create Variable Group in Azure DevOps

In `Pipelines > Library` create variable group: `vg-boutique-prod`.

Add variables:

- `azureServiceConnection = sc-azure-boutique`
- `apiWebAppName = app-boutique-api-prod`
- `apiBaseUrl = https://app-boutique-api-prod.azurewebsites.net/api`
- `staticWebAppToken = <deployment-token-from-static-web-app>` (secret)

How to get Static Web App token:

1. Azure Portal > Static Web App > Manage deployment token
2. Copy token
3. Store as secret variable in variable group

## 7. Add Environments and Approvals

In Azure DevOps `Pipelines > Environments`, create:

1. `boutique-dev`
2. `boutique-prod`

For `boutique-prod` add approval check:

1. Open environment
2. Approvals and checks
3. Add Approvals
4. Add approver(s): release manager/team lead

## 8. Create Multi-Stage Pipeline YAML

Create file at repository root: `azure-pipelines.yml`

```yaml
trigger:
  branches:
    include:
      - main

pr:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

variables:
  - group: vg-boutique-prod
  - name: nodeVersion
    value: '20.x'

stages:
  - stage: CI
    displayName: Build and Validate
    jobs:
      - job: Build
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(nodeVersion)'
            displayName: Use Node.js $(nodeVersion)

          - script: npm ci
            displayName: Install dependencies (workspaces)

          - script: npm run build --workspace=client
            displayName: Build frontend
            env:
              REACT_APP_API_URL: $(apiBaseUrl)

          - script: CI=true npm test --workspace=client -- --watch=false --passWithNoTests
            displayName: Run frontend tests

          - script: |
              mkdir -p $(Build.ArtifactStagingDirectory)/server
              rsync -av --exclude=node_modules --exclude=.env server/ $(Build.ArtifactStagingDirectory)/server/
            displayName: Prepare server artifact

          - task: ArchiveFiles@2
            inputs:
              rootFolderOrFile: '$(Build.ArtifactStagingDirectory)/server'
              includeRootFolder: false
              archiveType: zip
              archiveFile: '$(Build.ArtifactStagingDirectory)/server.zip'
              replaceExistingArchive: true
            displayName: Archive server package

          - publish: '$(Build.ArtifactStagingDirectory)/server.zip'
            artifact: api-package
            displayName: Publish API artifact

  - stage: CD_Prod
    displayName: Deploy to Production
    dependsOn: CI
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployApi
        displayName: Deploy API Web App
        environment: boutique-prod
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: api-package

                - task: AzureWebApp@1
                  displayName: Deploy API to Azure Web App
                  inputs:
                    azureSubscription: '$(azureServiceConnection)'
                    appType: webAppLinux
                    appName: '$(apiWebAppName)'
                    package: '$(Pipeline.Workspace)/api-package/server.zip'

      - job: DeployFrontend
        displayName: Deploy Frontend Static Web App
        dependsOn: DeployApi
        steps:
          - checkout: self

          - task: AzureStaticWebApp@0
            displayName: Deploy Frontend to Static Web App
            inputs:
              app_location: 'client'
              output_location: 'build'
              skip_api_build: true
              azure_static_web_apps_api_token: '$(staticWebAppToken)'
            env:
              REACT_APP_API_URL: $(apiBaseUrl)

      - job: SmokeTest
        displayName: Post-Deploy Smoke Test
        dependsOn: DeployFrontend
        steps:
          - script: |
              set -e
              curl -f https://$(apiWebAppName).azurewebsites.net/api/health
            displayName: Check API health endpoint
```

## 9. Create and Run the Pipeline

1. Azure DevOps > Pipelines > New pipeline
2. Select repository
3. Choose `Existing Azure Pipelines YAML file`
4. Select `azure-pipelines.yml`
5. Run pipeline

Expected flow:

1. CI builds and tests frontend
2. CI publishes API artifact (`server.zip`)
3. CD deploys API
4. CD deploys frontend
5. Smoke test validates API

## 10. Branching and Release Flow

Recommended strategy:

1. Developers push to feature branches
2. PR to `main`
3. CI validates PR
4. Merge to `main`
5. CD_Prod runs with environment approval
6. Approver approves deployment
7. Deployment executes

## 11. Security Best Practices

- Keep all secrets in variable groups as secret variables.
- Never commit `.env` files.
- Rotate `JWT_SECRET` and deployment tokens periodically.
- Restrict service connection scope to required resource group only.
- Use branch policies to block direct pushes to `main`.

## 12. Rollback Plan

If deployment fails:

1. API rollback:
   - Azure Portal > App Service > Deployment Center > Redeploy previous successful deployment
2. Frontend rollback:
   - Re-run pipeline from last successful run
   - Or redeploy previous Static Web App version
3. Database:
   - Keep Atlas backups enabled

## 13. Troubleshooting

### `AzureStaticWebApp@0` fails with token error

- Re-generate deployment token in Azure portal
- Update `staticWebAppToken` secret variable

### API returns 500 after deploy

- Check App Service logs (Log stream)
- Verify `MONGO_URI` and `JWT_SECRET` in app settings
- Validate Atlas IP allow list and network access

### Frontend deployed but API calls fail

- Confirm `REACT_APP_API_URL` value in pipeline
- Confirm CORS allows your Static Web App domain
- Confirm backend route is reachable: `/api/health`

### CI test step hangs

Use:

```bash
CI=true npm test --workspace=client -- --watch=false --passWithNoTests
```

## 14. Final Validation Checklist

- Pipeline succeeds end-to-end
- Frontend URL opens successfully
- Login API call works from deployed frontend
- `GET /api/health` returns 200
- MongoDB data reads/writes are working
- Production environment approval is enforced

---

## Optional Next Step: Split Dev and Prod

Duplicate the production stage and variable group for `dev`:

- `vg-boutique-dev`
- `boutique-dev` environment
- non-prod Azure resources

Then deploy from `develop` branch to dev, and from `main` to prod.
