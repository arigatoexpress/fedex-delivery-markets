# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM node:24.15.0-bookworm-slim@sha256:682f301a9e8e5731d4bb1889182a2186fe65a312cc81ae86cea6038ef8b1603f AS fetch
WORKDIR /seed
COPY --chmod=0444 package.json package-lock.json infra/kadima-verifier/SHA256SUMS ./
RUN sha256sum --check --strict SHA256SUMS
RUN npm ci --ignore-scripts --no-audit --no-fund --cache=/opt/npm-cache \
    && rm -rf node_modules

FROM node:24.15.0-bookworm-slim@sha256:682f301a9e8e5731d4bb1889182a2186fe65a312cc81ae86cea6038ef8b1603f AS deps
ENV SOURCE_DATE_EPOCH=1786731161
WORKDIR /opt/fedex-deps
COPY --chmod=0444 package.json package-lock.json infra/kadima-verifier/SHA256SUMS ./
COPY --from=fetch /opt/npm-cache /opt/npm-cache
RUN sha256sum --check --strict SHA256SUMS \
    && test "$(node --version)" = v24.15.0 \
    && test "$(npm --version)" = 11.12.1
RUN --network=none npm ci --offline --ignore-scripts --no-audit --no-fund --cache=/opt/npm-cache
RUN --network=none npm rebuild esbuild protobufjs --foreground-scripts --offline --cache=/opt/npm-cache
RUN rm -rf /opt/npm-cache node_modules/.vite node_modules/.vite-temp \
    && ln -s /tmp/fedex-vite-cache node_modules/.vite \
    && ln -s /tmp/fedex-vite-temp node_modules/.vite-temp \
    && chown -R 0:0 /opt/fedex-deps \
    && chmod -R a-w /opt/fedex-deps \
    && find /opt/fedex-deps -exec touch -h -d "@${SOURCE_DATE_EPOCH}" {} +

FROM node:24.15.0-bookworm-slim@sha256:682f301a9e8e5731d4bb1889182a2186fe65a312cc81ae86cea6038ef8b1603f AS runtime
LABEL io.kadima.package-json-sha256="f329a96130d21b3fdd35c93e851e2c3e3dfe910a242a5118ca49d22653795c58" \
      io.kadima.package-lock-sha256="9c25352c1d6b4836e2cf0dc5ef0eb7df3ae5fb80266a0167e541f3b3b97da5d3"
COPY --from=deps --chown=0:0 /opt/fedex-deps /opt/fedex-deps
COPY --chmod=0555 infra/kadima-verifier/fedex-verify /usr/local/bin/fedex-verify
USER 65532:65532
WORKDIR /workspace
CMD ["fedex-verify"]
