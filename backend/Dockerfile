FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build
WORKDIR /src

COPY backend/ZwitscherApi/ZwitscherApi.csproj backend/ZwitscherApi/
RUN dotnet restore backend/ZwitscherApi/ZwitscherApi.csproj

COPY backend/ZwitscherApi/ backend/ZwitscherApi/
COPY backend/dotnet-tools.json backend/dotnet-tools.json
WORKDIR /src/backend
RUN dotnet tool restore --tool-manifest dotnet-tools.json
RUN dotnet publish ZwitscherApi/ZwitscherApi.csproj \
    --configuration Release --no-restore --output /out \
    -p:OpenApiGenerateDocumentsOnBuild=false

FROM build AS migrate
ENTRYPOINT ["/bin/sh", "-c", "dotnet ef database update --project ZwitscherApi --configuration Release --no-build && chown -R 1654:1654 /data"]

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS api
WORKDIR /app
COPY --from=build /out/ ./
USER 1654:1654
EXPOSE 8080
ENTRYPOINT ["dotnet", "ZwitscherApi.dll"]
