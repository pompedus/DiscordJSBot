import sys
import aiohttp
import asyncio
import re
import json
import time
from bs4 import BeautifulSoup
from collections import Counter

allgods_lock = asyncio.Lock()
log_lock = asyncio.Lock()

class Log:
    @staticmethod
    async def info(message):
        async with log_lock:
            print(f'{{"Type":"Info", "Data":"{message}"}}')

    @staticmethod
    async def result(message):
        async with log_lock:
            print(f'{{"Type":"Result", "Data":{message}}}')

    @staticmethod
    async def error(message):
        async with log_lock:
            print(f'{{"Type":"Error", "Data":"{message}"}}')

async def fetch_html(session, url, semaphore):
    async with semaphore:
        async with session.get(url) as response:
            return await response.text()

async def get_html(url, semaphore):
    async with aiohttp.ClientSession() as session:
        return await fetch_html(session, url, semaphore)

def extract_links(html):
    pattern = r'href="(/match/\d+)"'
    return re.findall(pattern, html)

async def process_page(url, page_number, allgods, semaphore):
    html = await get_html(url, semaphore)
    links = extract_links(html)
    
    async def process_link(link):
        updated_url = f"{url}?page={page_number}" if page_number > 1 else url
        await extract_alt_attrs("https://smite.guru" + link, updated_url, allgods, semaphore)
    
    tasks = [process_link(link) for link in links]
    await asyncio.gather(*tasks)

async def extract_alt_attrs(url, profileurl, allgods, semaphore):
    startTime = time.perf_counter()
    mygods = []
    html = await get_html(url, semaphore)
    soup = BeautifulSoup(html, 'html.parser')
    mydiv = soup.find('section', {'id': 'matchup', 'data-v-12f6631c': ''})
    
    if mydiv is None:
        await Log.error(f"Could not find the section in {url}. It took {time.perf_counter() - startTime: 0.2f} seconds")
        return

    div = mydiv.find_all('div', {'class': 'columns', 'data-v-12f6631c': ''}, recursive=False)
    div = find_side(div, profileurl)
    
    if div is not None:
        images = div.find_all('img')
        for img in images:
            if img.has_attr('alt'):
                if img['alt'] == "":
                    mygods.append("Unknown god")
                else:
                    mygods.append(img['alt'])

    mygods = list(set(mygods))
    async with allgods_lock:
        allgods.extend(mygods)
    await Log.info(f"Finished fetch of {url}. It took {time.perf_counter() - startTime: 0.2f} seconds")

def count_names(names_list):
    count_dict = dict(Counter(names_list))
    sorted_dict = dict(sorted(count_dict.items(), key=lambda item: item[1], reverse=True))
    return sorted_dict

def extract_data(url):
    start = url.split('/profile/')[1]
    result = start.split('/matches')[0]
    return result

def find_side(div, url):
    del div[1]
    for side in div:
        if str(side).find(extract_data(url)) == -1:
            return side
    return ""

async def main():
    allgods = []
    if len(sys.argv) != 3:
        await Log.error("Usage: python script.py <website_url> <number_of_pages>")
        return

    url = f"{sys.argv[1]}/matches"
    pages = int(sys.argv[2])
    perfTimer = {"batch": time.perf_counter()}

    semaphore = asyncio.Semaphore(5)  # Limit to 4 concurrent get_html calls

    tasks = [process_page(url, page, allgods, semaphore) for page in range(1, pages + 1)]
    await asyncio.gather(*tasks)

    await Log.info(f"Finished fetch of batch. It took {time.perf_counter() - perfTimer['batch']: 0.2f} seconds")
    await Log.result(json.dumps(count_names(allgods)))

if __name__ == "__main__":
    asyncio.run(main())
