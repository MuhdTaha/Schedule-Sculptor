import React, { useState, useMemo } from "react";
import { CourseItem, CourseListHeader } from "./CourseComponents";

const sortByTerm = (a, b) => {
    const termOrder = { WS: 0, SP: 1, SU: 2, FA: 3 };
    const parse = (term) => {
        if (!term) return 0;
        const match = term.match(/(WS|SP|SU|FA)(\d+)/i);
        if (!match) return 0;
        const [, season, year] = match;
        const numericYear = parseInt(`20${year}`);
        return numericYear * 10 + termOrder[season.toUpperCase()];
    };
    return parse(a.semester) - parse(b.semester);
};

export default function CompletedView({ data }) {
    // Group courses by category (safe when data may be undefined)
    const grouped = useMemo(() => {
        const map = {};
        (data && data.completedCourses ? data.completedCourses : []).forEach((c) => {
            const cat = c.category || "Uncategorized";
            if (!map[cat]) map[cat] = [];
            map[cat].push(c);
        });
        return Object.entries(map).map(([category, courses]) => ({
            category,
            courses: courses.sort(sortByTerm),
        }));
    }, [data]);

    const [page, setPage] = useState(0);
    const totalPages = grouped.length;
    const current = grouped[page];

    if (grouped.length === 0) {
        return <p className="text-gray-500">No completed courses available.</p>;
    }

    return (
        <div className="flex-shrink-0">
            {/* Fixed Header Section - This stays at the top */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#4C3B6F]">Completed</h3>
                <h3 className="font-semibold text-[#4C3B6F] text-lg "> { current.category }</h3>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className={`px-4 py-2 rounded-md ${
                        page === 0
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#4C3B6F] text-white hover:bg-[#392d57]"
                    }`}
                >
                    ◀
                </button>

                <span className="text-gray-600 font-medium">
                    {page + 1} / {totalPages}
                </span>

                <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className={`px-4 py-2 rounded-md ${
                        page === totalPages - 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#4C3B6F] text-white hover:bg-[#392d57]"
                    }`}
                >
                    ▶
                </button>
            </div>

            {/* Scrollable Content Area - This expands downward only */}
            <div className="flex-grow min-h-0 mt-4">
                <div className="bg-white rounded-xl shadow p-4 h-full overflow-y-auto">
                    <CourseListHeader />
                    {current.courses.map((course, i) => (
                        <CourseItem
                            key={i}
                            term={course.semester || "N/A"}
                            code={course.code || "N/A"}
                            credits={parseFloat(course.credits) || 0}
                            grade={course.grade || "-"}
                            title={course.title || ""}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}