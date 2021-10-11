$(document).ready(async () => {
    /** @typedef {{ timestamp: string, count: number, uniques: number }}Entry */
    /** @type {Object<string, { views: Entry[], clones: Entry[] }>} */
    const allTraffic = await (await fetch('gh/traffic.json')).json();
    const today = new Date();

    /** @param {Entry[]} entries */
    const fillZeros = entries => {
        const t0 = new Date(
            entries[0]?.timestamp ||
                new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14),
        );
        /** @type {Entry[]} */
        const out = [];
        let t = new Date(t0);
        for (const e of entries) {
            while (new Date(e.timestamp) > t) {
                t.setDate(t.getDate() + 1);
                const timestamp = t.toISOString().replace('.000', '');
                if (timestamp === e.timestamp) break;

                out.push({
                    timestamp,
                    count: 0,
                    uniques: 0,
                });
            }
            out.push(e);
        }
        while (t < today) {
            t.setDate(t.getDate() + 1);
            const timestamp = t.toISOString().replace('.000', '');

            out.push({
                timestamp,
                count: 0,
                uniques: 0,
            });
        }
        return out;
    };

    /** @param {Entry[]} entries */
    const makeChart = entries => {
        const opt = {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Count',
                        data: entries.map(e => ({
                            x: new Date(e.timestamp),
                            y: e.count,
                        })),
                        fill: false,
                        borderColor: '#238636',
                        tension: 0.1,
                    },
                    {
                        label: 'Unique',
                        data: entries.map(e => ({
                            x: new Date(e.timestamp),
                            y: e.uniques,
                        })),

                        fill: false,
                        borderColor: '#1f6feb',
                        tension: 0.1,
                    },
                ],
            },
            options: {
                scales: {
                    xAxes: [
                        {
                            type: 'time',
                            time: {
                                tooltipFormat: 'll',
                            },
                        },
                    ],
                    yAxes: [
                        {
                            ticks: {
                                min: 0, // it is for ignoring negative step.
                                beginAtZero: true,
                                callback: function (value, index, values) {
                                    if (Math.floor(value) === value) {
                                        return value;
                                    }
                                },
                            },
                        },
                    ],
                },
                responsive: true,
                maintainAspectRatio: false,
            },
        };

        return opt;
    };

    /** @type {{ repo: string, views: Entry[], clones: Entry[] }[]} */
    const options = [];

    for (const repo in allTraffic) {
        const { views, clones } = allTraffic[repo];
        options.push({ repo, views: fillZeros(views), clones: fillZeros(clones) });
    }

    const charts = [];
    const setIndex = (i = 0) => {
        charts.forEach(c => c.destroy());
        $('#charts').html('');

        const { views, clones } = options[i];

        for (const [data, label] of [
            [views, 'Views'],
            [clones, 'Clones'],
        ]) {
            const canvas = document.createElement('canvas');
            $('#charts').append(
                $(`<div class="chart"><h3>${label}</h3></div>`).append(canvas),
            );
            const ctx = canvas.getContext('2d');
            charts.push(new Chart(ctx, makeChart(data)));
        }
    };

    const select = $('#repos')
        .html(options.map((o, i) => `<option value="${i}">${o.repo}</label>`).join('\n'))
        .change(() => setIndex(~~select.val()));
    select.select2();
    setIndex(0);
});
