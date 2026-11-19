#!/usr/bin/env bash
#
# Builds the site of tests/cms/: a Drupal 11 site (the recommended project) in DDEV, with the free
# theme bootstrap5 as its default theme and the content of drupal-content.php (a page of
# components, twelve articles for the front page's pager, a main menu with a drop-down menu).
#
#   SITE_DIR   where the site is made (default: ../drupal-site, beside this repository)
#   SITE_NAME  its DDEV project name, and so its address (default: bootstrapstepsdrupal)
#
# The site's own administrator gets a random password: nobody signs in.
# Under GitHub Actions, LAUNCH_URL is written to the job's environment.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="${SITE_DIR:-$(cd "$HERE/../../.." && pwd)/drupal-site}"
SITE_NAME="${SITE_NAME:-bootstrapstepsdrupal}"

mkdir -p "$SITE_DIR"
cd "$SITE_DIR"

ddev config --project-type=drupal11 --docroot=web --project-name="$SITE_NAME" --nodejs-version=24 --auto
ddev start -y < /dev/null

if [ ! -f composer.json ]; then
  ddev composer create-project drupal/recommended-project:^11 --no-interaction < /dev/null
fi
ddev composer require drush/drush drupal/bootstrap5 --no-interaction < /dev/null

if ! ddev drush status --field=bootstrap < /dev/null 2>/dev/null | grep -q Successful; then
  ddev drush site:install standard --site-name="Components site" --account-name=admin \
    --account-pass="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)" -y < /dev/null
fi

# The standard profile of Drupal 11.4 leaves the content types to core's recipes.
for type in page article; do
  if [ "$(ddev drush php:eval "echo \\Drupal\\node\\Entity\\NodeType::load('$type') ? 'yes' : 'no';" < /dev/null)" != "yes" ]; then
    ddev drush recipe "core/recipes/${type}_content_type" < /dev/null
  fi
done

ddev drush theme:enable bootstrap5 -y < /dev/null
ddev drush config:set system.theme default bootstrap5 -y < /dev/null

cp "$HERE/drupal-content.php" "$SITE_DIR/drupal-content.php"
ddev drush php:script drupal-content.php < /dev/null
ddev drush cache:rebuild < /dev/null

echo "The site answers at https://$SITE_NAME.ddev.site"
if [ -n "${GITHUB_ENV:-}" ]; then
  echo "LAUNCH_URL=https://$SITE_NAME.ddev.site" >> "$GITHUB_ENV"
fi
