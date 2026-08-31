frappe.pages["sales-forecast"].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Sales Forecast"),
        single_column: true,
    });

    page.main = $(wrapper).find(".layout-main-section");
    page.main.html(`
        <div class="crm-forecast">
            <div class="forecast-toolbar">
                <div class="forecast-toolbar-left">
                    <button class="btn btn-default btn-sm forecast-prev" title="${__("Previous")}">
                        <i class="fa fa-chevron-left"></i>
                    </button>
                    <button class="btn btn-default btn-sm forecast-today">
                        ${__("Today")}
                    </button>
                    <button class="btn btn-default btn-sm forecast-next" title="${__("Next")}">
                        <i class="fa fa-chevron-right"></i>
                    </button>
                    <select class="form-control input-sm forecast-months" style="width: 90px;">
                        <option value="3">3 ${__("months")}</option>
                        <option value="6" selected>6 ${__("months")}</option>
                        <option value="12">12 ${__("months")}</option>
                    </select>
                    <select class="form-control input-sm forecast-owner" style="width: 180px;">
                        <option value="">${__("All owners")}</option>
                    </select>
                </div>
                <div class="forecast-toolbar-right">
                    <button class="btn btn-default btn-sm forecast-refresh">
                        <i class="fa fa-refresh"></i> ${__("Refresh")}
                    </button>
                </div>
            </div>

            <div class="forecast-summary"></div>
            <div class="forecast-board-wrap">
                <div class="forecast-loading text-muted">
                    <i class="fa fa-spinner fa-spin"></i> ${__("Loading forecast...")}
                </div>
                <div class="forecast-board"></div>
            </div>
        </div>
    `);

    const state = {
        start: moment().startOf("month"),
        months: 6,
        owner: "",
    };

    function money(value, currency) {
        value = Number(value || 0);
        currency = currency || frappe.defaults.get_default("currency") || "GBP";

        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
            }).format(value);
        } catch (e) {
            return `${currency} ${frappe.utils.fmt_money(value)}`;
        }
    }

    function monthKey(date) {
        return moment(date).format("YYYY-MM");
    }

    function monthLabel(date) {
        return moment(date).format("MMMM YYYY");
    }

    function escapeHtml(value) {
        return $("<div>").text(value == null ? "" : value).html();
    }

    function renderSummary(deals) {
        const byCurrency = {};
        deals.forEach((d) => {
            const currency = d.currency || frappe.defaults.get_default("currency") || "GBP";
            byCurrency[currency] = byCurrency[currency] || { pipeline: 0, weighted: 0 };
            const value = Number(d.expected_deal_value || 0);
            const probability = Number(d.probability || 0) / 100;
            byCurrency[currency].pipeline += value;
            byCurrency[currency].weighted += value * probability;
        });

        const currencies = Object.keys(byCurrency);
        const html = currencies.length
            ? currencies.map((currency) => {
                const x = byCurrency[currency];
                return `
                    <div class="forecast-kpi">
                        <div class="forecast-kpi-label">${__("Pipeline")} · ${escapeHtml(currency)}</div>
                        <div class="forecast-kpi-value">${money(x.pipeline, currency)}</div>
                    </div>
                    <div class="forecast-kpi">
                        <div class="forecast-kpi-label">${__("Weighted forecast")} · ${escapeHtml(currency)}</div>
                        <div class="forecast-kpi-value">${money(x.weighted, currency)}</div>
                    </div>
                `;
            }).join("")
            : `<div class="text-muted">${__("No open deals in this period.")}</div>`;

        $(".forecast-summary").html(html);
    }

    function renderBoard(deals) {
        const columns = [];
        for (let i = 0; i < state.months; i++) {
            const date = state.start.clone().add(i, "months");
            columns.push({
                key: monthKey(date),
                date,
                deals: deals.filter((d) => monthKey(d.expected_closure_date) === monthKey(date)),
            });
        }

        const html = columns.map((column) => {
            const currencies = {};
            let dealCount = column.deals.length;

            column.deals.forEach((d) => {
                const currency = d.currency || frappe.defaults.get_default("currency") || "GBP";
                currencies[currency] = currencies[currency] || { pipeline: 0, weighted: 0 };
                const value = Number(d.expected_deal_value || 0);
                currencies[currency].pipeline += value;
                currencies[currency].weighted += value * Number(d.probability || 0) / 100;
            });

            const totals = Object.entries(currencies).map(([currency, x]) => `
                <div class="forecast-column-total">
                    <span>${money(x.pipeline, currency)}</span>
                    <span class="forecast-weighted">${money(x.weighted, currency)} ${__("weighted")}</span>
                </div>
            `).join("");

            const cards = column.deals.length
                ? column.deals.map((d) => {
                    const value = Number(d.expected_deal_value || 0);
                    const probability = Number(d.probability || 0);
                    const currency = d.currency || frappe.defaults.get_default("currency") || "GBP";
                    return `
                        <button class="forecast-deal-card" data-deal="${escapeHtml(d.name)}">
                            <div class="forecast-deal-top">
                                <span class="forecast-deal-org">${escapeHtml(d.organization || d.name)}</span>
                                <span class="forecast-deal-value">${money(value, currency)}</span>
                            </div>
                            <div class="forecast-deal-meta">
                                <span>${probability}%</span>
                                <span>${moment(d.expected_closure_date).format("D MMM")}</span>
                            </div>
                            <div class="forecast-deal-stage">${escapeHtml(d.status || "")}</div>
                            ${d.deal_owner ? `<div class="forecast-deal-owner">${escapeHtml(d.deal_owner)}</div>` : ""}
                        </button>
                    `;
                }).join("")
                : `<div class="forecast-empty">${__("No deals")}</div>`;

            return `
                <section class="forecast-column">
                    <header class="forecast-column-header">
                        <div>
                            <div class="forecast-column-month">${monthLabel(column.date)}</div>
                            <div class="forecast-column-count">${dealCount} ${dealCount === 1 ? __("deal") : __("deals")}</div>
                        </div>
                        <div class="forecast-column-totals">${totals}</div>
                    </header>
                    <div class="forecast-column-body">${cards}</div>
                </section>
            `;
        }).join("");

        $(".forecast-board").html(html);

        $(".forecast-deal-card").on("click", function () {
            frappe.set_route("crm", "deal", $(this).data("deal"));
        });
    }

    function loadOwners(owners) {
        const select = $(".forecast-owner");
        const current = state.owner;
        select.find("option:not(:first)").remove();

        owners.forEach((owner) => {
            select.append(`<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`);
        });

        select.val(current);
    }

    function load() {
        $(".forecast-loading").show();
        $(".forecast-board").hide();

        frappe.call({
            method: "crm_forecast.api.get_forecast",
            args: {
                start_date: state.start.format("YYYY-MM-DD"),
                months: state.months,
                owner: state.owner,
            },
            callback: function (r) {
                $(".forecast-loading").hide();
                $(".forecast-board").show();

                const data = r.message || {};
                loadOwners(data.owners || []);
                renderSummary(data.deals || []);
                renderBoard(data.deals || []);
            },
            error: function () {
                $(".forecast-loading").hide();
                $(".forecast-board").show().html(`
                    <div class="alert alert-danger">
                        ${__("Unable to load the forecast. Check CRM Deal read permissions and the browser console.")}
                    </div>
                `);
            },
        });
    }

    $(".forecast-prev").on("click", function () {
        state.start.subtract(state.months, "months");
        load();
    });

    $(".forecast-next").on("click", function () {
        state.start.add(state.months, "months");
        load();
    });

    $(".forecast-today").on("click", function () {
        state.start = moment().startOf("month");
        load();
    });

    $(".forecast-months").on("change", function () {
        state.months = Number($(this).val());
        load();
    });

    $(".forecast-owner").on("change", function () {
        state.owner = $(this).val();
        load();
    });

    $(".forecast-refresh").on("click", load);

    load();
};
