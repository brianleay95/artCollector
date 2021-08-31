const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=8f0bfbce-dbdc-4df0-9640-2002e2ce9479'; // USE YOUR KEY HERE

  async function fetchObjects() {
    const url = `${ BASE_URL }/object?${ KEY }`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.error(error);
    }
  }
  
  fetchObjects().then(x => console.log(x)); // { info: {}, records: [{}, {},]}

  async function fetchAllCenturies() {
    const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;
    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
      }
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
      localStorage.setItem('centuries', JSON.stringify(records));
      return records;
    } catch (error) {
      console.error(error);
    }
  }
  async function fetchAllClassifications() {
    const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;
    if (localStorage.getItem('classification')) {
       return JSON.parse(localStorage.getItem('classification'));
      }
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
      localStorage.setItem('classification', JSON.stringify(records));
      return records;
    } catch (error) {
      console.error(error);
    }
  }

  async function prefetchCategoryLists() {
    try {
      const [
        classifications, centuries
      ] = await Promise.all([
        fetchAllClassifications(),
        fetchAllCenturies()
      ]);
      // This provides a clue to the user, that there are items in the dropdown
      $('.classification-count').text(`(${ classifications.length })`);

      classifications.forEach(classification => {
        // append a correctly formatted option tag into
        $('#select-classification').append('<option value="'+classification.id+'">'+ classification.name +'</option>')
        // the element with id select-classification
      });

      // This provides a clue to the user, that there are items in the dropdown
      $('.century-count').text(`(${ centuries.length })`);
//console.log(centuries);
      centuries.forEach(century => {
        $('#select-century').append('<option value="'+century.name+'">'+ century.name +'</option>')

        // append a correctly formatted option tag into
        // the element with id select-century
      });
    } catch (error) {
      console.error(error);
    }
  }
  prefetchCategoryLists()

  function buildSearchString(){
    const selectClassification = $('#select-classification').val()
    const selectCentury = $('#select-century').val()
    const keyWords = $('#keywords').val()

    const url = `${ BASE_URL }/object?${ KEY }&classification=${selectClassification}&century=${selectCentury}&keyword=${keyWords}`;
  
    return url;
  }

  $('#search').on('submit', async function (event) {
    onFetchStart()
    // prevent the default
    event.preventDefault();
  
    try {
      // get the url from `buildSearchString`
      const url = buildSearchString()
      const encodedUrl = encodeURI(url); 
      console.log(encodedUrl)
      // fetch it with await, store the result
      const response = await fetch(encodedUrl);
      const data = await response.json();
      // log out both info and records when you get them
      updatePreview(data)
      console.log(data)
    } catch (error) {
      console.error("ERROR", error)
      // log out the error
    }finally {onFetchEnd()}
  });

  function onFetchStart() {
    $('#loading').addClass('active');
  }
  
  function onFetchEnd() {
    $('#loading').removeClass('active');
  }

  function renderPreview(record) {
    // grab description, primaryimageurl, and title from the record
    const recordDescription = record.description
    const recordPrimaryImageUrl = record.primaryimageurl
    const recordTitle= record.title

    return $(`<div class="object-preview">
      <a href="#">`+
      (recordPrimaryImageUrl != null ? `<img src="${ recordPrimaryImageUrl }" />` : '')+
      (recordTitle != null ? `<h3>${ recordTitle }</h3>` : '')+
      (recordDescription != null ? `<h3>${ recordDescription }</h3>` : '')+
      `</a>
    </div>`).data('record', record);
  }
    
  function updatePreview(data) {
    //const root = $('#preview');
    // grab the results element, it matches .results inside root


    if(data.info.prev) {
      $('.previous').data('url', data.info.prev).prop('disabled',false);
    } else {
      $('.previous').data('url', null).prop('disabled',true);
    }

    if(data.info.next) {
      $('.next').data('url', data.info.next).prop('disabled',false);
    } else {
      $('.next').data('url', null).prop('disabled',true);
    }

    $('.results').empty()
    data.records.forEach(function(record){
      $('.results').append(renderPreview(record))
    });  
    
    // empty it
    // loop over the records, and append the renderPreview
  }

  $('#preview .next, #preview .previous').on('click', async function (event) {
    onFetchStart()
    try{
      const url = $(event.target).data('url');
      const response = await fetch (url)
      const data = await response.json();
      console.log(data)
      updatePreview(data)
    } catch (error) {
      console.error("ERROR", error)
      // log out the error
    } finally {onFetchEnd()}
  });

  $('#preview').on('click', '.object-preview', function (event) {
    event.preventDefault(); // they're anchor tags, so don't follow the link
    const record = $(event.target).closest('.object-preview').data('record')
    console.log(record)
    $('#feature').html(renderFeature(record))
  });

  function renderFeature(record) {
    const { title, dated, description, culture, style, technique, medium, dimensions, people, department, division, contact, creditline, images, primaryimageurl} = record;
    return $(`<div class="object-feature">
    <header>
      <h3>${title}</h3>
      <h4>${dated}</h4>
    </header>
    <section class="facts">
    ${ factHTML("Description", description) }
    ${ factHTML("Culture", culture, 'culture') }
    ${ factHTML("Style", style) }
    ${ factHTML("Technique", technique, 'technique') }
    ${ factHTML("Medium", medium, 'medium') }
    ${ factHTML("Dimensions", dimensions) }
    ${
      people
      ? people.map(person =>
          factHTML('Person', person.displayname, 'person')
        ).join('')
      : ''
    }
    ${ factHTML("Department", department) }
    ${ factHTML("Division", division) }
    ${ factHTML('Contact', `<a target="_blank" href="mailto:${ contact }">${ contact }</a>`) }
    ${ factHTML("Credit Line", creditline) }
    </section>
    <section class="photos">
    ${ photosHTML(images, primaryimageurl) }
    </section>
  </div>`)
//  
}

  function searchURL(searchType, searchString) {
    return `${ BASE_URL }/object?${ KEY }&${ searchType }=${ searchString }`;
  }
  
  function factHTML(title, content, searchTerm = null) {
    // if content is empty or undefined, return an empty string ''
    if(content === undefined || content == '' || content == null){
      return ''
    } else if(searchTerm == null) {
      return `
      <span class="title">${ title }</span>
      <span class="content">${ content }</span>
      `
        // otherwise, if there is no searchTerm, return the two spans
    } else {
      // otherwise, return the two spans, with the content wrapped in an anchor tag
      return `
      <span class="title">${ title }</span>
      <span class="content"> <a href="${ searchURL(searchTerm, content)}">${ content }</a></span>
      `
    }
  }

  function photosHTML(images, primaryimageurl) {
    // if images is defined AND images.length > 0, map the images to the correct image tags, then join them into a single string.  the images have a property called baseimageurl, use that as the value for src
    if(images !== undefined && images.length > 0) {
      var html='';
      images.forEach(function(image){
        html += `<img src="${image.baseimageurl}"/>`
      })
      console.log(html)
      return html;
    } else if (primaryimageurl != undefined){
      return `<img src="${primaryimageurl}" />`
    } else {
      return ''
    }
    // else if primaryimageurl is defined, return a single image tag with that as value for src
  
    // else we have nothing, so return the empty string
  }

  $('#feature').on('click', 'a', async function (event) {
    // read href off of $(this) with the .attr() method
  const href = $(this).attr("href")
    // prevent default
    if (href.startsWith('mailto')) { return; }
  event.preventDefault()
    // call onFetchStart
  onFetchStart()
    // fetch the href
    try{
      const response = await fetch (href);
      const data = await response.json();
      // render it into the preview
      updatePreview(data)
      // call onFetchEnd
    }
    catch (error) {
    console.error("ERROR", error)
    }
    finally {onFetchEnd()}
  });