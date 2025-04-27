#!/bin/bash

# Script to trigger Vercel deployment
echo "Triggering Vercel deployment..."
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_2LPCW0AJrhW5bs2BStYwezA3tPbJ/laEbJc99Uv

echo -e "\nDeployment triggered! Check status on Vercel dashboard." 