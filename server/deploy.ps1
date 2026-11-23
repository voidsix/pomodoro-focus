# Publica el servidor de cobro de Foco Pro en Google Cloud Functions.
# Requisitos (una sola vez):
#   1. El proyecto foco-estudio-1b47c vinculado a una cuenta de facturación (Cloud Functions lo exige;
#      con el uso de Foco queda dentro del nivel gratuito).
#   2. El Access Token de producción de Mercado Pago guardado como secreto:
#        Read-Host "Access Token de Mercado Pago" | Out-File -NoNewline -Encoding ascii $env:TEMP\mp.txt
#        gcloud secrets create mp-access-token --data-file="$env:TEMP\mp.txt" --project foco-estudio-1b47c
#        Remove-Item $env:TEMP\mp.txt
# Para cambiar el precio: editá PRICE acá abajo y price en firebase-config.js, y volvé a correr este script.
$ErrorActionPreference = 'Continue'  # gcloud escribe su progreso en stderr
$project = 'foco-estudio-1b47c'
$price = 1200

gcloud services enable cloudfunctions.googleapis.com cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project $project

$sa = (gcloud projects describe $project --format='value(projectNumber)') + '-compute@developer.gserviceaccount.com'
foreach ($s in @('mp-access-token')) { gcloud secrets add-iam-policy-binding $s --member="serviceAccount:$sa" --role='roles/secretmanager.secretAccessor' --project $project | Out-Null }

gcloud functions deploy foco-pro --gen2 --runtime=nodejs24 --region=us-central1 --project $project `
  --source="$PSScriptRoot" --entry-point=api --trigger-http --allow-unauthenticated `
  --memory=256Mi --max-instances=3 `
  --set-env-vars="PRICE=$price,SITE_URL=https://focoestudio.app,DATABASE_URL=https://foco-estudio-1b47c-default-rtdb.firebaseio.com" `
  --set-secrets='MP_ACCESS_TOKEN=mp-access-token:latest'

gcloud functions describe foco-pro --gen2 --region=us-central1 --project $project --format='value(serviceConfig.uri)'
