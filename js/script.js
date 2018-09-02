/* eslint-env jquery, browser, webextensions */
$(document).ready(async function() {

  const storeUserPrefs = (key, value) => {
    chrome.storage.local.set({[key]: value}, function() {
      console.log('Value set to ' + value);
    });
  };
  const loadUserPrefs = async (key, value) => {
    return new Promise(resolve => {
      chrome.storage.local.get([key], function(result) {
        if (!result[key]) {
          storeUserPrefs(key, value);
          return resolve({[key]: value});
        }
        console.log('Value currently is ' + result[key]);
        return resolve(result[key]);
      });
    });
  };

  let minMaxPref = await loadUserPrefs('minMaxActive', 'max');
  let showHidePref = await loadUserPrefs('showHideActive', 'hide');

  const minActive = minMaxPref === 'min' ? 'active' : '';
  const maxActive = minMaxPref === 'max' ? 'active' : '';
  const showActive = showHidePref === 'show' ? 'active' : '';
  const hideActive = showHidePref === 'hide' ? 'active' : '';

  const htmlToInsert = () => `
<div>
  <div style="padding-top: 25px; position: absolute; height: 24px; width: 18px; display:inline-block;">
    <button id="price-filter-up-spf" class="btn btn-custom-spf btn-transparent btn-updown-top btn-sm btn-updown btn-rounded btn-block margin-top-sm">▲</button>
    <button id="price-filter-down-spf" class="btn btn-custom-spf btn-transparent btn-updown-bottom btn-sm btn-updown btn-rounded btn-block margin-top-sm">▼</button>
  </div>
  <div class="form-group margin-bottom-none">
    <div class="input-group-overlay clearable-text-field">
      <input id="price-filter-current-spf" class="form-control menu-item-search-input hidden-xs" type="text" placeholder="$0">
      <div class="input-underline"></div>
      <i class="ion-icon ion-android-close text-field-clear hidden"></i>
    </div>
  </div>
  <div class="margin-top-sm">
    <button id="price-filter-set-clear-spf" class="btn btn-custom-spf btn-warning btn-sm btn-rounded btn-block btn-set margin-bottom-sm">X</button>
  </div>
  <div class="text-center" style="max-width: 170px;">
    <p style="margin-bottom: 0;">Filter Min or Max price.</p>
    <button id="price-filter-min-spf" type="min-max" class="btn btn-custom-spf btn-default btn-sm btn-rounded btn-set btn-leftright btn-leftright-left ${minActive}">Min</button>
    <button id="price-filter-max-spf" type="min-max" class="btn btn-custom-spf btn-default btn-sm btn-rounded btn-set btn-leftright btn-leftright-right ${maxActive}">Max</button>
    <p style="margin-bottom: 0;">Show or hide filtered.</p>
    <button id="price-filter-hide-spf" type="show-hide" class="btn btn-custom-spf btn-default btn-sm btn-rounded btn-set btn-leftright btn-leftright-left ${hideActive}">Hide</button>
    <button id="price-filter-show-spf" type="show-hide" class="btn btn-custom-spf btn-default btn-sm btn-rounded btn-set btn-leftright btn-leftright-right ${showActive}">Show</button>
  </div>
</div>`;

  const filterForPriceRange = (price) => {
    $('div.restaurant-menu-list').find('div.row.menu-group').each(function() {
      $(this).find('div.menu-item').each(function() {
        const priceStr = $(this).find('td.menu-item-price').find('meta[itemprop="price"]').attr('content');
        const priceInt = parseFloat(priceStr);
        $(this).find('td.menu-item-price').find('strong[itemprop="price"]').removeAttr('style');
        $(this).find('div.menu-item-title').find('span[itemprop="name"]').removeAttr('style');
        $(this).removeAttr('style');
        if (minMaxPref === 'min') {
          if (priceInt < price && price !== 0) {
            if (showHidePref === 'show') {
              $(this).find('td.menu-item-price').find('strong[itemprop="price"]').css({color: 'red'});
              $(this).find('div.menu-item-title').find('span[itemprop="name"]').css({color: 'red'});
            } else if (showHidePref === 'hide') {
              $(this).css({display: 'none'});
            }
          }
        } else if (minMaxPref === 'max') {
          if (priceInt > price && price !== 0) {
            if (showHidePref === 'show') {
              $(this).find('td.menu-item-price').find('strong[itemprop="price"]').css({color: 'red'});
              $(this).find('div.menu-item-title').find('span[itemprop="name"]').css({color: 'red'});
            } else if (showHidePref === 'hide') {
              $(this).css({display: 'none'});
            }
          }
        }
      });
    });
  };

  $('div.container-fluid:has(#menu-item-search)').append(htmlToInsert);

  $('#price-filter-up-spf').click(function(e) {
    const priceFilterStr = $('#price-filter-current-spf').val();
    const priceFilterInt = parseFloat(priceFilterStr) || 0;
    const amountToChange = e.shiftKey ? 1 : 0.25;
    if (priceFilterInt + amountToChange <= 1000) {
      $('#price-filter-current-spf').val(priceFilterInt + amountToChange).trigger('price-filter');
    }
  });
  $('#price-filter-down-spf').click(function(e) {
    const priceFilterStr = $('#price-filter-current-spf').val();
    const priceFilterInt = parseFloat(priceFilterStr) || 0;
    const amountToChange = e.shiftKey ? 1 : 0.25;
    if (priceFilterInt - amountToChange > 0) {
      $('#price-filter-current-spf').val(priceFilterInt - amountToChange).trigger('price-filter');
    } else if (priceFilterInt - amountToChange === 0) {
      $('#price-filter-current-spf').val('').trigger('price-filter');
    }
  });
  $('#price-filter-set-clear-spf').click(function() {
    $('#price-filter-current-spf').val('').trigger('price-filter');
  });
  $('#price-filter-current-spf').bind('keyup input paste price-filter', function() {
    const priceFilterStr = $(this).val();
    const priceFilterInt = parseFloat(priceFilterStr) || 0;
    console.log('Updating price filter to: ' + priceFilterInt);
    filterForPriceRange(priceFilterInt);
  });

  $('button.btn-leftright').click(function() {
    $(`button.btn-leftright[type='${$(this).attr('type')}']`).each(function() {
      $(this).removeClass('active');
    });
    $(this).addClass('active');
    const filterMinActive = $('#price-filter-min-spf').hasClass('active');
    const filterMaxActive = $('#price-filter-max-spf').hasClass('active');
    const filterShowActive = $('#price-filter-show-spf').hasClass('active');
    const filterHideActive = $('#price-filter-hide-spf').hasClass('active');
    if ($(this).attr('type') === 'min-max') {
      if (filterMinActive && !filterMaxActive) {
        minMaxPref = 'min';
        $('#price-filter-current-spf').trigger('price-filter');
        storeUserPrefs('minMaxActive', 'min');
      } else if (filterMaxActive && !filterMinActive) {
        minMaxPref = 'max';
        $('#price-filter-current-spf').trigger('price-filter');
        storeUserPrefs('minMaxActive', 'max');
      }
    } else if ($(this).attr('type') === 'show-hide') {
      if (filterShowActive && !filterHideActive) {
        showHidePref = 'show';
        $('#price-filter-current-spf').trigger('price-filter');
        storeUserPrefs('showHideActive', 'show');
      } else if (filterHideActive && !filterShowActive) {
        showHidePref = 'hide';
        $('#price-filter-current-spf').trigger('price-filter');
        storeUserPrefs('showHideActive', 'hide');
      }
    }
  });

});