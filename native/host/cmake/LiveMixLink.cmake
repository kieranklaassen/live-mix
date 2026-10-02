# Pins the Ableton Link version the plug-in host builds against and adds it to
# the build as the `Ableton::Link` target. Link is header-only and brings its
# own copy of Asio as a submodule.
#
# Resolution order:
#   1. -DLINK_DIR=<path> or $ENV{LINK_DIR}: a checkout with its submodules
#   2. FetchContent of the pinned tag (no checkout needed)
#
# Link is licensed under GPL v2 or later (or a proprietary licence from
# Ableton). A host built with it is covered by that; -DLIVE_MIX_HOST_LINK=OFF
# builds the host without it.

set(LIVE_MIX_LINK_VERSION "4.1")
set(LIVE_MIX_LINK_GIT_TAG "Link-4.1")
set(LIVE_MIX_LINK_COMMIT "9c9091275e707ab09d09a5a608fcdb84bf0dec85")
set(LIVE_MIX_LINK_REPOSITORY "https://github.com/Ableton/link.git")

# A function, so the C++ standard Link's own CMake file sets stays in here.
function(live_mix_add_link)
    if(NOT DEFINED LINK_DIR AND DEFINED ENV{LINK_DIR} AND NOT "$ENV{LINK_DIR}" STREQUAL "")
        set(LINK_DIR "$ENV{LINK_DIR}" CACHE PATH "Path to Ableton Link")
    endif()

    if(DEFINED LINK_DIR AND EXISTS "${LINK_DIR}/AbletonLinkConfig.cmake")
        message(STATUS "live-mix: using Ableton Link from ${LINK_DIR}")
        include(${LINK_DIR}/AbletonLinkConfig.cmake)
    else()
        message(STATUS "live-mix: fetching Ableton Link ${LIVE_MIX_LINK_GIT_TAG} (${LIVE_MIX_LINK_COMMIT})")
        include(FetchContent)
        FetchContent_Declare(abletonlink
            GIT_REPOSITORY          ${LIVE_MIX_LINK_REPOSITORY}
            GIT_TAG                 ${LIVE_MIX_LINK_GIT_TAG}
            GIT_SHALLOW             TRUE
            GIT_SUBMODULES_RECURSE  TRUE
        )
        FetchContent_GetProperties(abletonlink)
        if(NOT abletonlink_POPULATED)
            FetchContent_Populate(abletonlink)
        endif()
        include(${abletonlink_SOURCE_DIR}/AbletonLinkConfig.cmake)
    endif()
endfunction()
