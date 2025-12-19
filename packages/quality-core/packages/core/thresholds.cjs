module.exports = {
    build: {
        bundle_total_kb: 600, // Increased for i18n integration
        largest_chunk_kb: 350,
        css_total_kb: 150,
        assets_count: 80
    },
    render: {
        fp_ms: 1500,
        inp_ms: 200,
        cls: 0.4, // Relaxed for dynamic dashboard content
        long_task_ms: 50,
        long_tasks_total_ms: 500
    },
    network: {
        api_timeout_ms: 3000
    },
    ux: {
        min_target_size: 44
    },
    a11y: {
        max_critical_violations: 0
    }
}
