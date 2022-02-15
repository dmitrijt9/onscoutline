################################
# Load ARGS from build
################################
ARG  NODE_IMAGE

################################
# Base image
################################
FROM $NODE_IMAGE as temp-base-image
WORKDIR /app
CMD ["yarn", "app:start:prod"]


################################
# Builder image
################################
FROM temp-base-image as temp-builder-image
COPY . /app
RUN yarn install
RUN yarn app:build
# # It is cache not remove?!
# RUN yarn cache clean
# RUN rm -rf \
#     /app/.dockerignore \
#     /app/tsconfig.json \
#     /app/src \
#     /app/.yarn/unplugged
# RUN yarn workspaces focus --production


################################
# Final production image
################################
FROM temp-base-image
COPY --from=temp-builder-image /app /app
