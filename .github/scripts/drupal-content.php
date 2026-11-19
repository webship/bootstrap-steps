<?php

/**
 * @file
 * The content of the Drupal test site: a page of components written in Full HTML with the
 * framework's own markup (a dialog, an accordion, tabs, a carousel, a dismissible alert, a form
 * with its fields marked valid and invalid as a server sends it back), twelve
 * articles for the front page's pager, and main menu links, one of them a drop-down menu.
 *
 * Run with `drush php:script drupal-content.php`; a second run changes nothing.
 */

use Drupal\menu_link_content\Entity\MenuLinkContent;
use Drupal\node\Entity\Node;

$storage = \Drupal::entityTypeManager()->getStorage('node');

$body = <<<'HTML'
<p>Questions our customers ask, and the ways to reach us.</p>
<h2>Opening hours</h2>
<p><button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#hoursModal">See the opening hours</button></p>
<div class="modal fade" id="hoursModal" tabindex="-1" aria-labelledby="hoursModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title fs-5" id="hoursModalLabel">Opening hours</h3>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body"><p>Monday to Friday, from 9:00 to 17:00.</p></div>
      <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button></div>
    </div>
  </div>
</div>
<h2>Questions</h2>
<div class="accordion" id="faq">
  <div class="accordion-item">
    <h3 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faqDelivery" aria-expanded="true" aria-controls="faqDelivery">How long does delivery take?</button></h3>
    <div id="faqDelivery" class="accordion-collapse collapse show" data-bs-parent="#faq"><div class="accordion-body">Three to five working days.</div></div>
  </div>
  <div class="accordion-item">
    <h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqReturns" aria-expanded="false" aria-controls="faqReturns">Can I return an item?</button></h3>
    <div id="faqReturns" class="accordion-collapse collapse" data-bs-parent="#faq"><div class="accordion-body">Yes, within thirty days of delivery.</div></div>
  </div>
  <div class="accordion-item">
    <h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqPayment" aria-expanded="false" aria-controls="faqPayment">Which payments do you take?</button></h3>
    <div id="faqPayment" class="accordion-collapse collapse" data-bs-parent="#faq"><div class="accordion-body">Bank transfer, cheque or cash on delivery.</div></div>
  </div>
</div>
<h2>Our services</h2>
<ul class="nav nav-tabs" role="tablist">
  <li class="nav-item" role="presentation"><button class="nav-link active" id="design-tab" data-bs-toggle="tab" data-bs-target="#design" type="button" role="tab" aria-controls="design" aria-selected="true">Design</button></li>
  <li class="nav-item" role="presentation"><button class="nav-link" id="development-tab" data-bs-toggle="tab" data-bs-target="#development" type="button" role="tab" aria-controls="development" aria-selected="false">Development</button></li>
  <li class="nav-item" role="presentation"><button class="nav-link" id="support-tab" data-bs-toggle="tab" data-bs-target="#support" type="button" role="tab" aria-controls="support" aria-selected="false">Support</button></li>
</ul>
<div class="tab-content border border-top-0 p-3 mb-4">
  <div class="tab-pane fade show active" id="design" role="tabpanel" aria-labelledby="design-tab" tabindex="0"><p>We draw the pages before we build them.</p></div>
  <div class="tab-pane fade" id="development" role="tabpanel" aria-labelledby="development-tab" tabindex="0"><p>We build the site and its tests together.</p></div>
  <div class="tab-pane fade" id="support" role="tabpanel" aria-labelledby="support-tab" tabindex="0"><p>We answer within one working day.</p></div>
</div>
<h2>Projects</h2>
<div id="projects" class="carousel slide mb-4" role="region" aria-roledescription="carousel" aria-label="Projects">
  <div class="carousel-indicators">
    <button type="button" data-bs-target="#projects" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
    <button type="button" data-bs-target="#projects" data-bs-slide-to="1" aria-label="Slide 2"></button>
    <button type="button" data-bs-target="#projects" data-bs-slide-to="2" aria-label="Slide 3"></button>
  </div>
  <div class="carousel-inner">
    <div class="carousel-item active"><div class="d-block w-100 bg-secondary text-white p-5 text-center"><h3>A school website</h3><p>Timetables, news and a page for every class.</p></div></div>
    <div class="carousel-item"><div class="d-block w-100 bg-secondary text-white p-5 text-center"><h3>A shop</h3><p>A catalogue, a cart and a checkout.</p></div></div>
    <div class="carousel-item"><div class="d-block w-100 bg-secondary text-white p-5 text-center"><h3>A museum</h3><p>The collection, the exhibitions and the tickets.</p></div></div>
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#projects" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span></button>
  <button class="carousel-control-next" type="button" data-bs-target="#projects" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span></button>
</div>
<div class="alert alert-info alert-dismissible fade show" role="alert">Our office is closed on public holidays.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>
<h2>A form, as the server sent it back</h2>
<form class="row g-3" novalidate>
  <div class="col-md-6"><label for="contactName" class="form-label">Your name</label><input type="text" class="form-control is-valid" id="contactName" value="Jane"><div class="valid-feedback">Looks good!</div></div>
  <div class="col-md-6"><label for="contactEmail" class="form-label">Your email</label><input type="email" class="form-control is-invalid" id="contactEmail" value="jane@" aria-describedby="contactEmailFeedback"><div id="contactEmailFeedback" class="invalid-feedback">Please enter a valid email address.</div></div>
</form>
HTML;

$existing = $storage->loadByProperties(['type' => 'page', 'title' => 'Components']);
$page = $existing ? reset($existing) : Node::create(['type' => 'page', 'title' => 'Components']);
$page->set('body', ['value' => $body, 'format' => 'full_html']);
$page->set('path', ['alias' => '/components']);
$page->setPublished();
$page->save();
echo "Page: /components (node {$page->id()})\n";

// Twelve articles: the front page lists ten, and its pager the rest.
for ($i = 1; $i <= 12; $i++) {
  $title = sprintf('News item %02d', $i);
  if ($storage->loadByProperties(['type' => 'article', 'title' => $title])) {
    continue;
  }
  $article = Node::create([
    'type' => 'article',
    'title' => $title,
    'body' => ['value' => "<p>The text of news item $i.</p>", 'format' => 'basic_html'],
    'promote' => 1,
    'status' => 1,
    'created' => \Drupal::time()->getRequestTime() - $i * 3600,
  ]);
  $article->save();
}
echo "Articles: 12\n";

// Main menu: a link to the page, and a parent with two children that the theme shows as a
// drop-down menu (an expanded link).
$links = \Drupal::entityTypeManager()->getStorage('menu_link_content');
$find = function ($title) use ($links) {
  $found = $links->loadByProperties(['menu_name' => 'main', 'title' => $title]);
  return $found ? reset($found) : NULL;
};
if (!$find('Components')) {
  MenuLinkContent::create(['title' => 'Components', 'link' => ['uri' => 'internal:/components'], 'menu_name' => 'main', 'weight' => 1])->save();
}
$parent = $find('Services');
if (!$parent) {
  $parent = MenuLinkContent::create(['title' => 'Services', 'link' => ['uri' => 'internal:/components'], 'menu_name' => 'main', 'weight' => 2, 'expanded' => TRUE]);
  $parent->save();
}
foreach (['Design' => 1, 'Development' => 2] as $title => $weight) {
  if (!$find($title)) {
    MenuLinkContent::create(['title' => $title, 'link' => ['uri' => 'internal:/components'], 'menu_name' => 'main', 'parent' => 'menu_link_content:' . $parent->uuid(), 'weight' => $weight])->save();
  }
}
echo "Main menu: Components, Services (Design, Development)\n";
